"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, ShieldCheck, Waves, AlertTriangle, ChevronRight, MapPin, Calendar, Skull, Flame, X, Sun, Moon } from 'lucide-react';
import Richter3DScene from './simuladores/mat03/Richter3DScene';

const EARTHQUAKES = [
  { id: 'sanfrancisco_1906', nombre: 'San Francisco', pais: 'EE.UU.', anio: 1906, magnitud: 7.9, victimas: '~3,000', descripcion: 'El Gran Terremoto destruyó el 80% de la ciudad. Los incendios posteriores ardieron 3 días causando más daño que el sismo.', dato: 'Ruptura de 477 km en la Falla de San Andrés', imagen: '/images/eq-sanfrancisco-1906.png', color: '#f59e0b' },
  { id: 'valdivia_1960', nombre: 'Valdivia', pais: 'Chile', anio: 1960, magnitud: 9.5, victimas: '~5,700', descripcion: 'El sismo más potente jamás registrado. Generó un tsunami que cruzó el Pacífico y devastó costas en Japón y Hawái.', dato: 'Liberó ~1/4 de toda la energía sísmica del siglo XX', imagen: '/images/eq-valdivia-1960.png', color: '#ef4444' },
  { id: 'cdmx_1985', nombre: 'Ciudad de México', pais: 'México', anio: 1985, magnitud: 8.1, victimas: '~10,000', descripcion: 'Devastó la CDMX a 350 km del epicentro. El suelo arcilloso amplificó las ondas hasta 5 veces su intensidad.', dato: 'Efecto de sitio: el suelo blando amplificó la destrucción', imagen: '/images/eq-cdmx-1985.png', color: '#10b981' },
  { id: 'sumatra_2004', nombre: 'Océano Índico', pais: 'Indonesia', anio: 2004, magnitud: 9.1, victimas: '~230,000', descripcion: 'Generó el tsunami más mortífero de la historia, afectando 14 países. La ruptura se extendió 1,300 km.', dato: 'La Tierra vibró ~1 cm en su totalidad', imagen: '/images/eq-sumatra-2004.png', color: '#06b6d4' },
  { id: 'haiti_2010', nombre: 'Haití', pais: 'Haití', anio: 2010, magnitud: 7.0, victimas: '~316,000', descripcion: 'Magnitud moderada pero catástrofe humanitaria sin precedentes por construcciones sin código sísmico y epicentro a 25 km de la capital.', dato: 'La vulnerabilidad social multiplica el desastre', imagen: '/images/eq-haiti-2010.png', color: '#8b5cf6' },
  { id: 'tohoku_2011', nombre: 'Tōhoku', pais: 'Japón', anio: 2011, magnitud: 9.1, victimas: '~19,759', descripcion: 'Desplazó Japón 2.4 m al este. El tsunami superó muros de 10 m y provocó el desastre nuclear de Fukushima.', dato: 'Aceleró la rotación terrestre en 1.8 μs/día', imagen: '/images/eq-tohoku-2011.png', color: '#f43f5e' },
];

export default function PilotoRichter() {
  const { richter, setMagnitudM3, toggleLogViewM3, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore();
  const { magnitudActual, magnitudBase, isLogView } = richter;
  const [mounted, setMounted] = useState(false);
  const [wavePoints, setWavePoints] = useState<number[]>([]);
  const [selectedEq, setSelectedEq] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  const getModeColor = (color: string) => {
    if (!isLightMode) return color;
    const map: Record<string, string> = {
      '#3b82f6': '#1d4ed8', // blue
      '#f59e0b': '#b45309', // amber
      '#ef4444': '#b91c1c', // red
      '#10b981': '#047857', // emerald
      '#06b6d4': '#0e7490', // cyan
      '#8b5cf6': '#6d28d9', // violet
      '#f43f5e': '#be123c', // rose
      '#d946ef': '#a21caf', // fuchsia
    };
    return map[color] || color;
  };

  useEffect(() => { 
    setMounted(true); 
    setAsistente({ visible: true, text: "Bienvenido al Centro de Alerta Sísmica. Ajusta la magnitud para observar cómo la energía crece exponencialmente.", pose: "thinking" });
    return () => setAsistente({ visible: false });
  }, []);

  const deltaM = magnitudActual - magnitudBase;
  const multiplicadorEnergetico = Math.pow(10, 1.5 * deltaM);

  useEffect(() => {
    const interval = setInterval(() => {
      setWavePoints(prev => {
        const amp = magnitudActual > 3 ? Math.pow(1.7, magnitudActual - 3) * 1.5 : 1;
        const np = (Math.random() - 0.5) * amp;
        const arr = [...prev, np];
        if (arr.length > 200) arr.shift();
        return arr;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [magnitudActual]);

  const polylinePath = useMemo(() => wavePoints.map((y, x) => `${x * 5},${100 + y}`).join(' '), [wavePoints]);

  const closestEq = useMemo(() => {
    let c = EARTHQUAKES[0], d = Infinity;
    for (const eq of EARTHQUAKES) { const diff = Math.abs(eq.magnitud - magnitudActual); if (diff < d) { d = diff; c = eq; } }
    return d < 0.5 ? c : null;
  }, [magnitudActual]);

  const activeEq = EARTHQUAKES.find(e => e.id === selectedEq) || null;

  useEffect(() => {
    if (magnitudActual !== 1 && pasoActual === 0) setPasoActual(1);
    if (isLogView && pasoActual < 2) setPasoActual(2);
    if (selectedEq && pasoActual < 3) setPasoActual(3);
  }, [magnitudActual, isLogView, selectedEq, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col font-['Outfit'] transition-colors duration-1000 ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#020617] text-white'}`}>
      
      {/* DYNAMIC ATMOSPHERIC VIGNETTE */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 40%, ${
          magnitudActual > 7 
            ? (isLightMode ? 'rgba(225,29,72,0.1)' : 'rgba(244,63,94,0.15)') 
            : magnitudActual > 4 
              ? (isLightMode ? 'rgba(217,119,6,0.08)' : 'rgba(251,146,60,0.1)') 
              : (isLightMode ? 'rgba(3,105,161,0.05)' : 'rgba(56,189,248,0.05)')
        } 100%)`,
        }}
      />
      {/* Danger border pulse at high magnitudes */}
      {magnitudActual > 7 && (
        <motion.div 
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ repeat: Infinity, duration: 2 - (magnitudActual - 7) * 0.3 }}
          className="absolute inset-0 pointer-events-none z-[2] border-2 rounded-none"
          style={{ borderColor: magnitudActual > 8 ? '#ef4444' : '#f97316' }}
        />
      )}
      {/* GIANT BG NUMBER */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
        <span className="text-[16rem] font-black font-mono select-none italic" style={{ color: magnitudActual > 7 ? '#ef4444' : '#f43f5e' }}>{magnitudActual.toFixed(1)}</span>
      </div>

      {/* CHECKLIST HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-rose-500/30 px-4 py-2 rounded-full shadow-[0_0_40px_rgba(244,63,94,0.08)] pointer-events-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="text-rose-400" size={12} />
            <span className="text-[8px] font-black text-rose-300 uppercase tracking-widest">MAT-03</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex gap-1">
            {[{ step: 1, label: "Magnitud" }, { step: 2, label: "Log" }, { step: 3, label: "Hito" }].map(s => (
              <div key={s.step} className={`px-2.5 py-1 rounded-full border flex items-center gap-1 text-[7px] font-black uppercase tracking-widest transition-all ${pasoActual >= s.step ? 'bg-rose-600 border-rose-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                {pasoActual > s.step ? <ShieldCheck size={7} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D SCENE */}
      <div className="absolute inset-0 z-0">
        <Richter3DScene magnitudActual={magnitudActual} magnitudBase={magnitudBase} escenario={richter.escenario} isLightMode={isLightMode} />
      </div>

      {/* HUD OVERLAY */}
      <div className="relative z-10 p-5 flex flex-col h-full pointer-events-none">
        
        {/* TOP METRICS */}
        <div className="flex justify-between items-start mt-10">
          <div className="flex gap-2 pointer-events-auto">
            <MiniCard label="Magnitud" value={`Mw ${magnitudActual.toFixed(1)}`} icon={<Waves size={10} />} color="#f43f5e" isLightMode={isLightMode} />
            <MiniCard label="Intensidad" value={`${multiplicadorEnergetico > 1000 ? (multiplicadorEnergetico/1000).toFixed(1) + 'k' : Math.round(multiplicadorEnergetico).toLocaleString()}×`} icon={<Zap size={10} />} color={isLightMode ? "#eab308" : "#facc15"} isLightMode={isLightMode} />
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setIsLightMode(!isLightMode)}
              className={`p-3 rounded-xl backdrop-blur-xl border transition-all ${isLightMode ? 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white' : 'bg-black/50 border-white/10 text-white/70 hover:bg-white/10'}`}
            >
              {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className={`backdrop-blur-xl border px-4 py-2 rounded-xl flex flex-col justify-center ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/50 border-white/10'}`}>
              <span className="text-[7px] font-black text-slate-500 uppercase block">Impacto</span>
            <span className={`text-sm font-black italic tracking-tighter ${magnitudActual > 7 ? 'text-rose-500' : magnitudActual > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {magnitudActual < 3 ? 'MICRO' : magnitudActual < 5 ? 'MENOR' : magnitudActual < 7 ? 'MODERADO' : magnitudActual < 8 ? 'MAYOR' : 'CATASTRÓFICO'}
            </span>
          </div>
          </div>
        </div>

        {/* EXPANDED EARTHQUAKE DETAIL CARD (center overlay) */}
        <AnimatePresence>
          {activeEq && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-auto w-[520px]"
            >
              <div className={`backdrop-blur-3xl border-2 rounded-[2rem] shadow-2xl overflow-hidden ${isLightMode ? 'bg-white/95 text-slate-900' : 'bg-[#0A1121]/95 text-white'}`} style={{ borderColor: `${getModeColor(activeEq.color)}40` }}>
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img src={activeEq.imagen} alt={activeEq.nombre} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1121] via-[#0A1121]/30 to-transparent" />
                  <button onClick={() => setSelectedEq(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight drop-shadow-md">{activeEq.nombre}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-bold text-white/60 flex items-center gap-1"><MapPin size={8} />{activeEq.pais}</span>
                      <span className="text-[9px] font-bold text-white/60 flex items-center gap-1"><Calendar size={8} />{activeEq.anio}</span>
                      <span className="text-[9px] font-bold text-rose-300 flex items-center gap-1"><Skull size={8} />{activeEq.victimas}</span>
                      <span className="text-sm font-black font-mono px-2 py-0.5 rounded-lg" style={{ color: getModeColor(activeEq.color), background: `${getModeColor(activeEq.color)}15` }}>Mw {activeEq.magnitud}</span>
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5 space-y-3">
                  <p className={`text-[11px] font-medium leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>{activeEq.descripcion}</p>
                  <div className={`flex items-start gap-2 rounded-xl p-3 border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                    <Flame size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className={`text-[10px] font-bold italic ${isLightMode ? 'text-amber-700' : 'text-amber-200/80'}`}>{activeEq.dato}</span>
                  </div>
                  <div className="flex gap-3">
                    <div className={`flex-1 rounded-xl p-3 border text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Energía vs Mw 6.0</span>
                      <span className="text-lg font-black font-mono" style={{ color: getModeColor(activeEq.color) }}>×{Math.round(Math.pow(10, 1.5 * (activeEq.magnitud - 6.0))).toLocaleString()}</span>
                    </div>
                    <div className={`flex-1 rounded-xl p-3 border text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block">Amplitud vs Mw 6.0</span>
                      <span className={`text-lg font-black font-mono ${isLightMode ? 'text-slate-900' : 'text-white'}`}>×{Math.round(Math.pow(10, activeEq.magnitud - 6.0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BOTTOM SECTION: Controls + Earthquake Timeline ── */}
        <div className="mt-auto space-y-3 pointer-events-auto">
          
          {/* EARTHQUAKE HORIZONTAL TIMELINE */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {EARTHQUAKES.map(eq => {
              const isClosest = closestEq?.id === eq.id;
              const isSelected = selectedEq === eq.id;
              return (
                <motion.button
                  key={eq.id}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedEq(isSelected ? null : eq.id); audio?.playPop(); }}
                  className={`flex-shrink-0 rounded-xl border backdrop-blur-xl px-3 py-2 flex items-center gap-2.5 transition-all min-w-[150px] ${
                    isSelected ? (isLightMode ? 'border-slate-300 bg-white shadow-lg' : 'border-white/30 bg-white/15 shadow-lg') 
                    : isClosest ? (isLightMode ? 'border-rose-300 bg-rose-50 shadow-md' : 'border-rose-500/40 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]') 
                    : (isLightMode ? 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300' : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10')
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative" style={{ background: `${getModeColor(eq.color)}20` }}>
                    <span className="text-[8px] font-black" style={{ color: getModeColor(eq.color) }}>{eq.anio}</span>
                    {isClosest && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]" />}
                  </div>
                  <div className="text-left min-w-0">
                    <div className={`text-[9px] font-black truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{eq.nombre}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7px] font-bold text-slate-500">{eq.pais}</span>
                      <span className="text-[8px] font-black font-mono" style={{ color: getModeColor(eq.color) }}>Mw {eq.magnitud}</span>
                    </div>
                  </div>
                  <ChevronRight size={10} className={`ml-auto flex-shrink-0 ${isLightMode ? 'text-slate-300' : 'text-white/20'}`} />
                </motion.button>
              );
            })}
          </div>

          {/* CONTROL DOCK */}
          <div className={`backdrop-blur-3xl border p-5 rounded-[2rem] shadow-2xl flex items-center gap-8 ${isLightMode ? 'bg-white/90 border-slate-200' : 'bg-[#0A1121]/90 border-white/10'}`}>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Control de Magnitud</span>
                <span className={`text-[10px] font-black text-rose-500 font-mono px-2 py-0.5 rounded-lg border ${isLightMode ? 'bg-rose-50 border-rose-100' : 'bg-white/5 border-white/5'}`}>{magnitudActual.toFixed(1)} Mw</span>
              </div>
              <div className="relative">
                <input type="range" min="1" max="10" step="0.1" value={magnitudActual} 
                  onChange={e => { setMagnitudM3(parseFloat(e.target.value)); audio?.playPop(); }}
                  className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-rose-500 ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`} />
                <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none">
                  {EARTHQUAKES.map(eq => (
                    <div key={eq.id} className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full opacity-50" style={{ left: `${((eq.magnitud - 1) / 9) * 100}%`, background: getModeColor(eq.color) }} />
                  ))}
                </div>
              </div>
              <AnimatePresence mode="wait">
                {closestEq && (
                  <motion.div key={closestEq.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 px-1">
                    <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: getModeColor(closestEq.color) }} />
                    <span className="text-[7px] font-bold text-slate-400">≈ <span className={isLightMode ? 'text-slate-700' : 'text-white/70'}>{closestEq.nombre} ({closestEq.anio})</span></span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className={`flex items-center gap-3 border-l pl-8 ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
              <button onClick={() => { toggleLogViewM3(); audio?.playPop(); }}
                className={`px-5 py-2.5 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all border ${isLogView ? 'bg-rose-500 border-rose-400 text-white shadow-lg' : (isLightMode ? 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10')}`}>
                Escala Log
              </button>
              <div className={`w-[180px] h-12 rounded-xl overflow-hidden p-2 border ${isLightMode ? 'bg-white border-slate-200' : 'bg-black/40 border-white/5'}`}>
                <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                  <polyline 
                    points={polylinePath} 
                    fill="none" 
                    stroke={magnitudActual > 7 ? "#ef4444" : magnitudActual > 4 ? "#f43f5e" : "#fb7185"} 
                    strokeWidth={magnitudActual > 7 ? "8" : "4"} 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLLAPSE WARNING */}
      <AnimatePresence>
        {magnitudActual > 9.0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none bg-rose-600/15 backdrop-blur-[2px]">
            <div className="bg-rose-600 border border-rose-400 px-10 py-5 rounded-[2.5rem] shadow-[0_0_80px_rgba(244,63,94,0.5)] flex flex-col items-center">
              <AlertTriangle className="text-white mb-2 animate-bounce" size={36} />
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Colapso Estructural</h2>
              <p className="text-rose-100 font-bold text-[9px] uppercase tracking-widest mt-1 animate-pulse">Integridad en Peligro</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniCard({ label, value, icon, color, isLightMode }: any) {
  return (
    <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 backdrop-blur-md shadow-xl ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-[#0A1121]/80 border-white/10'}`}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, color }}>{icon}</div>
      <div>
        <span className={`block text-[7px] font-black uppercase tracking-widest ${isLightMode ? 'text-slate-400' : 'text-white/30'}`}>{label}</span>
        <span className={`block text-base font-black tracking-tighter leading-none italic font-mono ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{value}</span>
      </div>
    </div>
  );
}
