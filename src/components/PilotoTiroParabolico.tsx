"use client";

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ESCENARIOS, RANGO_ANGULO, RANGO_VELOCIDAD, simularDisparo, type Escenario } from '@/domain/fisica';
import TiroParabolico3DScene from './simuladores/fis01/TiroParabolico3DScene';
import AvisoReto from './fisica/AvisoReto';

export default function PilotoTiroParabolico({ onValidate }: { onValidate?: () => void }) {
  const { tiro1, generarSemillaF1, ejecutarDisparoF1, setTiro1, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    tiro1: s.tiro1, generarSemillaF1: s.generarSemillaF1, ejecutarDisparoF1: s.ejecutarDisparoF1,
    setTiro1: s.setTiro1, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { angulo, velocidad, disparando, targetX, resultado, distanciaReal, y0, obsX, obsY, escenario, viento, municion, aciertos, ultimoDisparo } = tiro1;
  const esc = ESCENARIOS[escenario] ?? ESCENARIOS.tierra;

  useEffect(() => {
    if (disparando) audio?.playPop();
  }, [disparando, audio]);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al polígono de tiro. Neutraliza el dron de la diana roja ajustando el ángulo y la velocidad inicial. La guía gris solo marca la dirección de salida: la curva real depende de la gravedad, del aire y del viento.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => {
    if (resultado === 'exito') audio?.playSuccess();
    else if (resultado === 'colision' || resultado === 'fallo') audio?.playError();
  }, [resultado, audio]);

  // v_y(t) del ÚLTIMO disparo, ya aterrizado (se calcula con el mismo motor del store).
  const curvaVy = useMemo(() => {
    if (!ultimoDisparo || disparando) return null;
    const r = simularDisparo(ultimoDisparo, ultimoDisparo, true);
    const vmax = Math.max(1, ...r.muestras.map((m) => Math.abs(m.vy)));
    const T = Math.max(r.t, 0.01);
    return r.muestras.map((m) => `${((m.t / T) * 100).toFixed(1)},${(-(m.vy / vmax) * 9).toFixed(2)}`).join(' ');
  }, [ultimoDisparo, disparando]);

  const cambiarEscenario = (e: Escenario) => {
    if (disparando || e === escenario) return;
    setTiro1({ escenario: e });
    generarSemillaF1();
    audio?.playPop();
  };

  return (
    <div className="flex h-full w-full bg-[#03040a] overflow-hidden font-['Outfit'] relative text-white">

      {/* ── ESCENA 3D — TIRO PARABÓLICO (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <TiroParabolico3DScene
          angulo={angulo} y0={y0} obsX={obsX} obsY={obsY} targetX={targetX}
          volando={disparando} escenario={escenario} ultimoDisparo={ultimoDisparo}
        />
      </div>

      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#03040a]/70 via-transparent to-[#03040a]/80" />

      {/* Resultado del último disparo (no bloquea la escena) */}
      <AnimatePresence>
        {resultado && !disparando && (
          <motion.div
            key={`${ultimoDisparo?.id}`}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`absolute top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-6 py-3 rounded-2xl backdrop-blur-xl border text-center ${
              resultado === 'exito' ? 'bg-emerald-500/15 border-emerald-500/50' : resultado === 'colision' ? 'bg-orange-500/15 border-orange-500/50' : 'bg-red-500/15 border-red-500/50'}`}
          >
            <div className={`text-lg font-black uppercase tracking-tight ${resultado === 'exito' ? 'text-emerald-400' : resultado === 'colision' ? 'text-orange-400' : 'text-red-400'}`}>
              {resultado === 'exito' ? 'Blanco neutralizado' : resultado === 'colision' ? 'Impacto en el muro' : 'Fuera del blanco'}
            </div>
            <div className="text-[11px] font-bold text-white/70">
              {resultado === 'colision' ? `El proyectil chocó con el muro en x = ${obsX} m` : `Cayó en x = ${distanciaReal.toFixed(1)} m (diana en ${targetX} m)`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow h-full w-full relative overflow-hidden flex flex-col z-20 pointer-events-none">

        {/* TELEMETRÍA DE MISIÓN */}
        <div className="absolute top-6 left-6 z-30 flex flex-col gap-3 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-sky-500/30 flex flex-wrap items-center gap-5 max-w-fit">
            <span className="text-sm font-black text-white uppercase tracking-widest leading-none">
              Tiro Parabólico <br/><span className="text-sky-400 text-[10px]">Datos de la misión</span>
            </span>
            <Dato label="Muro x" valor={`${obsX} m`} color="text-orange-400" />
            <Dato label="Muro alto" valor={`${obsY} m`} color="text-orange-400" />
            <Dato label="Diana x" valor={`${targetX} m`} color="text-red-400" />
            <Dato label="Altura y₀" valor={`${y0} m`} />
          </div>
          <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5 flex flex-wrap gap-5 max-w-fit">
            <Dato label="g" valor={`${esc.g.toFixed(2)} m/s²`} />
            <Dato label="Viento" valor={`${viento >= 0 ? '+' : ''}${viento.toFixed(1)} m/s`} color={viento >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <Dato label="Densidad aire" valor={`${esc.rho.toFixed(3)} kg/m³`} />
            <Dato label="Aciertos" valor={`${aciertos}`} color={aciertos > 0 ? 'text-emerald-400' : 'text-white'} />
          </div>
          <div className="bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/5 flex gap-1 max-w-fit">
            {(Object.keys(ESCENARIOS) as Escenario[]).map((e) => (
              <button key={e} onClick={() => cambiarEscenario(e)} disabled={disparando}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${escenario === e ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {ESCENARIOS[e].nombre}
              </button>
            ))}
          </div>
        </div>

        {/* DOCK DE CONTROL */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-6 bg-black/70 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2rem] shadow-2xl pointer-events-auto max-w-[95vw]">
          <Deslizador label="Ángulo θ" unidad="°" valor={angulo} r={RANGO_ANGULO} color="accent-sky-500" disabled={disparando}
            onChange={(v) => setTiro1({ angulo: v })} />
          <Deslizador label="Velocidad v₀" unidad=" m/s" valor={velocidad} r={RANGO_VELOCIDAD} color="accent-amber-500" disabled={disparando}
            onChange={(v) => setTiro1({ velocidad: v })} />
          <button onClick={() => ejecutarDisparoF1()} disabled={disparando || municion <= 0}
            className="h-12 px-8 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95">
            Disparar ({municion})
          </button>
          <button onClick={() => { generarSemillaF1(); audio?.playPop(); }} disabled={disparando}
            className="h-12 px-6 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95">
            Nueva misión
          </button>
        </div>

        {/* v_y(t) del último disparo */}
        {curvaVy && (
          <div className="absolute bottom-28 left-6 z-30 w-56 h-32 bg-black/60 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-3 flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1"><Activity size={10} /> v_y(t) del último disparo</span>
            </div>
            <svg viewBox="0 -10 100 20" className="w-full h-full">
              <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
              <polyline points={curvaVy} fill="none" stroke="#38bdf8" strokeWidth="0.8" />
            </svg>
            <span className="text-[7px] font-bold text-slate-500 uppercase text-right">cruza el cero en la altura máxima</span>
          </div>
        )}

        <div className="absolute bottom-28 right-6 z-40">
          <AvisoReto visible={aciertos > 0 && !disparando} onValidate={onValidate}
            texto="Impacto confirmado. Ya puedes validar tu práctica (o seguir practicando en otros planetas)." />
        </div>
      </main>
    </div>
  );
}

function Dato({ label, valor, color = 'text-white' }: { label: string; valor: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-black tabular-nums ${color}`}>{valor}</span>
    </div>
  );
}

function Deslizador({ label, unidad, valor, r, color, disabled, onChange }: {
  label: string; unidad: string; valor: number; r: { min: number; max: number; paso: number };
  color: string; disabled?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[170px]">
      <div className="flex justify-between">
        <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-white">{valor}{unidad}</span>
      </div>
      <input type="range" min={r.min} max={r.max} step={r.paso} value={valor} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-40 ${color}`} />
    </div>
  );
}
