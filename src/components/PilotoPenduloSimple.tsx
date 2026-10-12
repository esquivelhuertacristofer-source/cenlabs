"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, RotateCcw, Play, Square, ShieldAlert, Activity, Plus, Trash2, Lock } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF3, periodoMedido, OSCILACIONES_MIN } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import { useCronometro, formatoCrono } from './fisica/useCronometro';

const PenduloSimple3DScene = dynamic(() => import('./simuladores/fis03/PenduloSimple3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicializando Laboratorio Geofísico...</div>
});

export default function PilotoPenduloSimple({ onValidate }: { onValidate?: () => void }) {
  const { pendulo3, setPendulo3, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    pendulo3: s.pendulo3, setPendulo3: s.setPendulo3, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { gSemilla, longitud, masa, oscilando, muestras, gAlumno } = pendulo3;

  // Cronómetro manual (estado local; al store solo van las muestras registradas)
  const { corriendo, ms, alternar, reiniciar: resetCrono } = useCronometro();
  const [nOsc, setNOsc] = useState(String(OSCILACIONES_MIN));
  const [contador, setContador] = useState(0);
  const [gInput, setGInput] = useState(gAlumno !== null ? String(gAlumno) : '');
  const [alerta, setAlerta] = useState<string | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de geofísica. La gravedad local es desconocida: mídela con un péndulo. Cronometra varias oscilaciones completas por muestra para que tu error de reacción no domine.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  const toggleCrono = () => { audio?.playPop(); alternar(); };

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const registrar = () => {
    const n = parseInt(nOsc, 10);
    if (corriendo) return avisar('Detén el cronómetro antes de registrar.');
    if (ms <= 0) return avisar('Mide un tiempo con el cronómetro antes de registrar.');
    if (!Number.isFinite(n) || n < 1) return avisar('Indica cuántas oscilaciones completas cronometraste.');
    if (n < OSCILACIONES_MIN) return avisar(`Cronometra al menos ${OSCILACIONES_MIN} oscilaciones: con una sola, tu tiempo de reacción domina el error.`);
    setPendulo3({ muestras: [...muestras, { L: longitud, m: masa, n, t: Math.round(ms) / 1000 }], resultado: null });
    audio?.playPop();
    resetCrono();
  };

  const borrar = (i: number) => setPendulo3({ muestras: muestras.filter((_, k) => k !== i), resultado: null });

  const guardarG = (v: string) => {
    setGInput(v);
    const g = parseFloat(v);
    setPendulo3({ gAlumno: Number.isFinite(g) ? g : null, resultado: null });
  };

  // Progreso del protocolo (sin revelar g): mismas condiciones que el validador.
  const progreso = useMemo(() => {
    const Ls = new Set(muestras.map((s) => s.L)).size;
    const masaIndep = muestras.some((a) => muestras.some((b) => a.L === b.L && a.m !== b.m));
    return { Ls, masaIndep };
  }, [muestras]);
  // Se comprueba a petición (no en cada tecla), con la misma regla que el validador.
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF3> | null>(null);
  useEffect(() => { setVeredicto(null); }, [muestras, gAlumno]);
  const comprobar = () => {
    const v = evaluarF3(pendulo3);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <PenduloSimple3DScene longitud={longitud} masa={masa} isOscilando={oscilando} gravedad={gSemilla} onOscilacion={setContador} />
      </div>

      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} /><span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CRONÓMETRO + REGISTRO */}
      <div className="absolute top-6 left-6 z-30 w-[360px] max-w-[92vw] flex flex-col gap-4">
        <div className="bg-[#0f172a]/85 backdrop-blur-2xl border border-sky-500/30 p-6 rounded-[2rem]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2"><Timer size={16} className="text-sky-400" /> Cronómetro</span>
            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${oscilando ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'}`}>
              <Activity size={10} className="inline mr-1" />{oscilando ? `Fotopuerta: ${contador} osc.` : 'En reposo'}
            </span>
          </div>
          <div className="text-5xl font-black font-mono text-center mb-4 tabular-nums">{formatoCrono(ms)}</div>
          <div className="flex gap-2 mb-4">
            <button onClick={toggleCrono} className={`flex-1 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest ${corriendo ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
              {corriendo ? 'Detener' : 'Iniciar'}
            </button>
            <button onClick={resetCrono} aria-label="Reiniciar cronómetro" className="px-4 bg-slate-800/60 rounded-2xl border border-slate-700"><RotateCcw size={16} /></button>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oscilaciones cronometradas (n)</span>
              <input type="number" min={1} value={nOsc} onChange={(e) => setNOsc(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono" />
            </label>
            <button onClick={registrar} className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1 text-[10px] font-black uppercase"><Plus size={14} /> Registrar</button>
          </div>
        </div>

        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Muestras ({muestras.length})</span>
          <div className="mt-2 max-h-40 overflow-y-auto">
            {muestras.length === 0 ? <p className="text-[10px] text-slate-500 italic">Sin muestras todavía.</p> : (
              <table className="w-full text-[10px] font-mono">
                <thead><tr className="text-slate-500"><th className="text-left">L</th><th className="text-left">m</th><th className="text-left">n</th><th className="text-left">t</th><th className="text-left">T = t/n</th><th /></tr></thead>
                <tbody>
                  {muestras.map((s, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td>{s.L} m</td><td>{s.m} kg</td><td>{s.n}</td><td>{s.t.toFixed(2)} s</td><td>{periodoMedido(s).toFixed(3)} s</td>
                      <td><button aria-label="Borrar muestra" onClick={() => borrar(i)} className="text-slate-500 hover:text-rose-400"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ul className="mt-3 space-y-1 text-[10px]">
            <li className={progreso.masaIndep ? 'text-emerald-300' : 'text-slate-400'}>• Dos masas con la misma longitud</li>
            <li className={progreso.Ls >= 3 ? 'text-emerald-300' : 'text-slate-400'}>• Tres longitudes distintas ({progreso.Ls}/3)</li>
          </ul>
          <label className="block mt-3">
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">g calculada con tus datos (m/s²)</span>
            <input type="number" step="0.01" value={gInput} onChange={(e) => guardarG(e.target.value)} placeholder="g = 4π²L/T²"
              className="w-full mt-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono text-lg" />
          </label>
          <button onClick={comprobar} className="w-full mt-3 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Comprobar análisis</button>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-6 bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-700/50 px-6 py-4 rounded-[2rem]">
        <ControlSlider label="Longitud L" value={longitud} min={0.5} max={3} step={0.5} unit=" m" locked={oscilando} onChange={(v) => setPendulo3({ longitud: v })} />
        <ControlSlider label="Masa m" value={masa} min={1} max={5} step={1} unit=" kg" locked={oscilando} onChange={(v) => setPendulo3({ masa: v })} />
        <button onClick={() => { setPendulo3({ oscilando: !oscilando }); audio?.playPop(); }}
          aria-label={oscilando ? 'Detener el péndulo' : 'Soltar el péndulo'}
          className={`h-14 w-14 rounded-full flex items-center justify-center ${oscilando ? 'bg-rose-600' : 'bg-sky-600'}`}>
          {oscilando ? <Square fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
        </button>
      </div>

      <div className="absolute bottom-28 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="Tus muestras y tu g son coherentes. Valida tu práctica." />
      </div>
    </div>
  );
}

function ControlSlider({ label, value, min, max, step, unit, locked, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; locked?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className={`flex flex-col gap-2 min-w-[160px] ${locked ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">{locked && <Lock size={10} />}{label}</span>
        <span className="text-sm font-black text-sky-300">{value.toFixed(1)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={locked}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500 disabled:cursor-not-allowed" />
    </div>
  );
}
