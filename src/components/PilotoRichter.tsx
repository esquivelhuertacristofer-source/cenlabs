"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Skull, Flame, X, CheckCircle2 } from 'lucide-react';
import LabLayout, { Lectura, Deslizador, BotonLab } from './simulador/LabLayout';
import Richter3DScene from './simuladores/mat03/Richter3DScene';
import { SISMOS_M3 } from '@/domain/matematicas';

const EARTHQUAKES = [
  { id: 'sanfrancisco_1906', nombre: 'San Francisco', pais: 'EE.UU.', anio: 1906, magnitud: 7.9, victimas: '~3,000', descripcion: 'El Gran Terremoto destruyó el 80% de la ciudad. Los incendios posteriores ardieron 3 días causando más daño que el sismo.', dato: 'Ruptura de 477 km en la Falla de San Andrés', imagen: '/images/eq-sanfrancisco-1906.webp', color: '#f59e0b' },
  { id: 'valdivia_1960', nombre: 'Valdivia', pais: 'Chile', anio: 1960, magnitud: 9.5, victimas: '~5,700', descripcion: 'El sismo más potente jamás registrado. Generó un tsunami que cruzó el Pacífico y devastó costas en Japón y Hawái.', dato: 'Liberó ~1/4 de toda la energía sísmica del siglo XX', imagen: '/images/eq-valdivia-1960.webp', color: '#ef4444' },
  { id: 'cdmx_1985', nombre: 'Ciudad de México', pais: 'México', anio: 1985, magnitud: 8.1, victimas: '~10,000', descripcion: 'Devastó la CDMX a 350 km del epicentro. El suelo arcilloso amplificó las ondas hasta 5 veces su intensidad.', dato: 'Efecto de sitio: el suelo blando amplificó la destrucción', imagen: '/images/eq-cdmx-1985.webp', color: '#10b981' },
  { id: 'sumatra_2004', nombre: 'Océano Índico', pais: 'Indonesia', anio: 2004, magnitud: 9.1, victimas: '~230,000', descripcion: 'Generó el tsunami más mortífero de la historia, afectando 14 países. La ruptura se extendió 1,300 km.', dato: 'La Tierra vibró ~1 cm en su totalidad', imagen: '/images/eq-sumatra-2004.webp', color: '#06b6d4' },
  { id: 'haiti_2010', nombre: 'Haití', pais: 'Haití', anio: 2010, magnitud: 7.0, victimas: '~316,000', descripcion: 'Magnitud moderada pero catástrofe humanitaria sin precedentes por construcciones sin código sísmico y epicentro a 25 km de la capital.', dato: 'La vulnerabilidad social multiplica el desastre', imagen: '/images/eq-haiti-2010.webp', color: '#8b5cf6' },
  { id: 'tohoku_2011', nombre: 'Tōhoku', pais: 'Japón', anio: 2011, magnitud: 9.1, victimas: '~19,759', descripcion: 'Desplazó Japón 2.4 m al este. El tsunami superó muros de 10 m y provocó el desastre nuclear de Fukushima.', dato: 'Aceleró la rotación terrestre en 1.8 μs/día', imagen: '/images/eq-tohoku-2011.webp', color: '#f43f5e' },
];

/**
 * MAT-03 · Logaritmos y magnitud de momento.
 * El reto: el sismo OBJETIVO (dato) se compara con la base Mw 6.0 y el alumno
 * calcula el factor de energía 10^(1.5·ΔM). Ningún panel muestra ese factor ya
 * calculado; «Escala Log» cambia la gráfica E/E_base contra Mw entre eje lineal
 * y logarítmico (en log es una recta de pendiente 1.5).
 */
export default function PilotoRichter({ onValidate }: { onValidate?: () => void }) {
  const { richter, setMagnitudM3, toggleLogViewM3, setUserInputM3, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      richter: s.richter, setMagnitudM3: s.setMagnitudM3, toggleLogViewM3: s.toggleLogViewM3, setUserInputM3: s.setUserInputM3,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { magnitudActual, magnitudBase, isLogView, status, targetM, userInputFactor } = richter;
  const [mounted, setMounted] = useState(false);
  const [selectedEq, setSelectedEq] = useState<string | null>(null);
  const isLightMode = false;
  const sismoObjetivo = SISMOS_M3.find((x) => x.id === richter.escenario) ?? SISMOS_M3[0];

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
    setAsistente({ visible: true, text: "Bienvenido al Centro de Alerta Sísmica. Compara el sismo objetivo con la base Mw 6.0: ¿cuántas veces más energía liberó? Calcula 10^(1.5·ΔM).", pose: "thinking" });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closestEq = useMemo(() => {
    let c = EARTHQUAKES[0], d = Infinity;
    for (const eq of EARTHQUAKES) { const diff = Math.abs(eq.magnitud - magnitudActual); if (diff < d) { d = diff; c = eq; } }
    return d < 0.5 ? c : null;
  }, [magnitudActual]);

  const activeEq = EARTHQUAKES.find(e => e.id === selectedEq) || null;

  useEffect(() => {
    if (magnitudActual !== magnitudBase && pasoActual === 0) setPasoActual(1);
    if (isLogView && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [magnitudActual, magnitudBase, isLogView, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  const impacto = magnitudActual < 3 ? 'MICRO' : magnitudActual < 5 ? 'MENOR' : magnitudActual < 7 ? 'MODERADO' : magnitudActual < 8 ? 'MAYOR' : 'CATASTRÓFICO';
  const pasos = ['Magnitud', 'Log', 'Hito'];

  return (
    <LabLayout
      tituloPanel="Sismos"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="Sismo objetivo" acento valor={`${sismoObjetivo.nombre}${sismoObjetivo.anio ? ` ${sismoObjetivo.anio}` : ''} · Mw ${targetM.toFixed(1)}`} />
          <Lectura etiqueta="Base" valor={`Mw ${magnitudBase.toFixed(1)}`} />
          <Lectura etiqueta="Experimental" valor={`Mw ${magnitudActual.toFixed(1)}`} />
          <Lectura etiqueta="Impacto" valor={impacto} />
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          {pasos[Math.min(2, Math.max(0, pasoActual - 1))]} · paso {Math.max(1, pasoActual)}/3
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Richter3DScene magnitudActual={magnitudActual} magnitudBase={magnitudBase} escenario={richter.escenario} objetivo={{ nombre: `${sismoObjetivo.nombre}${sismoObjetivo.anio ? ` ${sismoObjetivo.anio}` : ''}`, mw: targetM }} />
          <AnimatePresence>
            {activeEq && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-1/2 top-1/2 z-20 w-[min(92%,480px)] -translate-x-1/2 -translate-y-1/2"
              >
                <div className="overflow-hidden rounded-2xl border-2 bg-[#0A1121]/95 text-white shadow-2xl" style={{ borderColor: `${activeEq.color}60` }}>
                  <div className="relative h-36 overflow-hidden">
                    <img src={activeEq.imagen} alt={activeEq.nombre} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1121] via-[#0A1121]/30 to-transparent" />
                    <button onClick={() => setSelectedEq(null)} aria-label="Cerrar" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 hover:bg-white/10"><X size={14} /></button>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-xl font-black uppercase italic tracking-tight">{activeEq.nombre}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-bold text-white/70">
                        <span className="flex items-center gap-1"><MapPin size={10} />{activeEq.pais}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />{activeEq.anio}</span>
                        <span className="flex items-center gap-1 text-rose-300"><Skull size={10} />{activeEq.victimas}</span>
                        <span className="rounded-lg px-2 py-0.5 font-mono text-sm font-black" style={{ color: activeEq.color, background: `${activeEq.color}25` }}>Mw {activeEq.magnitud}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-[12px] leading-relaxed text-slate-300">{activeEq.descripcion}</p>
                    <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 p-2.5">
                      <Flame size={13} className="mt-0.5 shrink-0 text-amber-400" />
                      <span className="text-[11px] font-semibold italic text-amber-200/90">{activeEq.dato}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
      panelLateral={
        <div className="space-y-3 text-slate-300">
          <p>Cada unidad de magnitud multiplica ×10 la amplitud de la onda (+20 dB) y mucho más la energía liberada. El papel del sismógrafo tiene escala fija: por eso el registro usa un atenuador en pasos de 10 dB.</p>
          <p>Compara el sismo objetivo con la base Mw {magnitudBase.toFixed(1)} y calcula cuántas veces más energía liberó.</p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className="min-w-[220px] flex-1">
              <Deslizador etiqueta="Control de magnitud" valor={magnitudActual} min={1} max={10} paso={0.1} decimales={1} unidad="Mw" ancho="w-full"
                onChange={(v) => { setMagnitudM3(v); audio?.playPop(); }} />
              <div className="mt-0.5 h-4 text-[11px] text-slate-400">
                {closestEq && <>≈ <span className="font-semibold text-slate-200">{closestEq.nombre} ({closestEq.anio})</span></>}
              </div>
            </div>
            <BotonLab variante={isLogView ? 'primario' : 'secundario'} onClick={() => { toggleLogViewM3(); audio?.playPop(); }}>Escala log</BotonLab>
          </div>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Factor energético 10^(1.5·ΔM)</span>
              <div className="flex items-center gap-2">
                <input
                  type="text" inputMode="decimal" value={userInputFactor} onChange={(e) => setUserInputM3(e.target.value)} placeholder="E / E₀"
                  className="h-8 w-28 rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-[12px] font-bold text-white outline-none focus:border-rose-500"
                />
                <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
                  {status === 'success' ? 'Verificado' : 'Verificar factor'}
                </BotonLab>
                {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Revisa el cálculo</span>}
                {status === 'success' && <span role="status" className="flex items-center gap-1 text-[12px] font-semibold text-emerald-300"><CheckCircle2 size={13} /> Correcto</span>}
              </div>
            </div>
            <GraficaEnergia mExp={magnitudActual} mBase={magnitudBase} log={isLogView} />
          </div>
          <div className="flex w-0 min-w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Sismos históricos">
            {EARTHQUAKES.map((eq) => {
              const sel = selectedEq === eq.id;
              return (
                <button key={eq.id} type="button" onClick={() => { setSelectedEq(sel ? null : eq.id); audio?.playPop(); }}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold ${sel ? 'border-white/40 bg-white/15 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/30'}`}>
                  <i className="inline-block h-2 w-2 rounded-full" style={{ background: eq.color }} />
                  {eq.nombre} {eq.anio} <span className="font-mono text-slate-400">Mw {eq.magnitud}</span>
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
}

/**
 * E/E_base contra Mw (1–10). En escala lineal la curva es una «L» (casi todo es
 * ~0 frente a los sismos grandes); en logarítmica es una RECTA de pendiente 1.5
 * por unidad de Mw. Marca solo la magnitud experimental, sin rotular su factor.
 */
function GraficaEnergia({ mExp, mBase, log }: { mExp: number; mBase: number; log: boolean }) {
  const W = 220, H = 78, M0 = 1, M1 = 10;
  const yLog = (m: number) => 1.5 * (m - mBase);                 // log10(E/E_base)
  const yMin = yLog(M0), yMax = yLog(M1);
  const yDe = (m: number) => log
    ? H - ((yLog(m) - yMin) / (yMax - yMin)) * H
    : H - (Math.pow(10, yLog(m)) / Math.pow(10, yMax)) * H;
  const xDe = (m: number) => ((m - M0) / (M1 - M0)) * W;
  const pts = useMemo(
    () => Array.from({ length: 91 }, (_, i) => M0 + i * 0.1).map((m) => `${xDe(m).toFixed(1)},${yDe(m).toFixed(1)}`).join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log, mBase],
  );
  const yDecada = (d: number) => H - ((d - yMin) / (yMax - yMin)) * H;
  const decadas = log ? Array.from({ length: Math.floor(yMax) - Math.ceil(yMin) + 1 }, (_, i) => Math.ceil(yMin) + i) : [];
  return (
    <div className="rounded-xl border border-white/5 bg-black/40 p-2">
      <div className="mb-1 flex justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>E/E₀ vs Mw</span><span>{log ? 'eje y logarítmico' : 'eje y lineal'}</span>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {decadas.map((d) => (
          <g key={d}>
            <line x1={0} x2={W} y1={yDecada(d)} y2={yDecada(d)} stroke="#1e293b" strokeWidth={1} />
            {d % 2 === 0 && <text x={2} y={yDecada(d) - 2} fontSize={8} fill="#94a3b8">{`10^${d}`}</text>}
          </g>
        ))}
        {[2, 4, 6, 8, 10].map((m) => (
          <text key={m} x={xDe(m) - 3} y={H - 1} fontSize={8} fill="#94a3b8">{m}</text>
        ))}
        <polyline points={pts} fill="none" stroke="#f43f5e" strokeWidth={2} />
        <circle cx={xDe(mExp)} cy={yDe(mExp)} r={3.5} fill="#facc15" />
      </svg>
    </div>
  );
}
