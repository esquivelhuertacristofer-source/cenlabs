"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, RotateCcw, Play, Square, ShieldAlert, Plus, Trash2, Lock, Ruler } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF4, elongacionEquilibrio, lecturaRegla, periodoMedido, OSCILACIONES_MIN } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import { useCronometro, formatoCrono } from './fisica/useCronometro';

const LeyHooke3DScene = dynamic(() => import('./simuladores/fis04/LeyHooke3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#010409] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicializando banco de resortes...</div>
});

export default function PilotoLeyHooke({ onValidate }: { onValidate?: () => void }) {
  const { hooke4, setHooke4, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    hooke4: s.hooke4, setHooke4: s.setHooke4, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { kSemilla, masa, amplitud, oscilando, estatica, dinamica, kAlumno } = hooke4;

  const { corriendo, ms, alternar, reiniciar } = useCronometro();
  const [nOsc, setNOsc] = useState(String(OSCILACIONES_MIN));
  const [kInput, setKInput] = useState(kAlumno !== null ? String(kAlumno) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF4> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al banco de resortes. La constante k del resorte es desconocida: mídela por dos caminos —la elongación estática (F = k·x) y el periodo de oscilación (T = 2π√(m/k))— y comprueba que coinciden.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => { setVeredicto(null); }, [estatica, dinamica, kAlumno]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  // Lectura de la regla con la carga en equilibrio (al milímetro).
  const lectura = lecturaRegla(elongacionEquilibrio(masa, kSemilla));

  const registrarEstatica = () => {
    if (oscilando) return avisar('Detén la oscilación: la regla se lee con la carga en reposo.');
    setHooke4({ estatica: [...estatica.filter((s) => s.m !== masa), { m: masa, x: lectura }], resultado: null });
    audio?.playPop();
  };

  const registrarDinamica = () => {
    const n = parseInt(nOsc, 10);
    if (corriendo) return avisar('Detén el cronómetro antes de registrar.');
    if (ms <= 0) return avisar('Mide un tiempo con el cronómetro antes de registrar.');
    if (!Number.isFinite(n) || n < 1) return avisar('Indica cuántas oscilaciones completas cronometraste.');
    if (n < OSCILACIONES_MIN) return avisar(`Cronometra al menos ${OSCILACIONES_MIN} oscilaciones: con una sola, tu tiempo de reacción domina el error.`);
    setHooke4({ dinamica: [...dinamica, { m: masa, A: amplitud, n, t: Math.round(ms) / 1000 }], resultado: null });
    audio?.playPop();
    reiniciar();
  };

  const guardarK = (v: string) => {
    setKInput(v);
    const k = parseFloat(v);
    setHooke4({ kAlumno: Number.isFinite(k) ? k : null, resultado: null });
  };

  const comprobar = () => {
    const v = evaluarF4(hooke4);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  const progreso = useMemo(() => ({
    est: new Set(estatica.map((s) => s.m)).size,
    din: new Set(dinamica.map((s) => s.m)).size,
    amp: new Set(dinamica.map((s) => s.A)).size,
  }), [estatica, dinamica]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <LeyHooke3DScene k={kSemilla} masa={masa} amplitud={amplitud} isOscilando={oscilando} />
      </div>

      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} /><span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MÉTODO ESTÁTICO */}
      <div className="absolute top-6 left-6 z-30 w-[340px] max-w-[92vw] flex flex-col gap-4">
        <div className="bg-[#0f172a]/85 backdrop-blur-2xl border border-cyan-500/30 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black text-cyan-300 uppercase tracking-[0.2em] flex items-center gap-2"><Ruler size={14} /> Método estático · regla</span>
          <div className="flex justify-between items-end mt-3">
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Elongación en equilibrio</span>
              <span className="text-2xl font-mono font-black text-cyan-300">{oscilando ? '— oscilando —' : `${lectura.toFixed(3)} m`}</span>
            </div>
            <button onClick={registrarEstatica} disabled={oscilando}
              className="h-10 px-3 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><Plus size={14} /> Registrar</button>
          </div>
          {estatica.length > 0 && (
            <p className="text-[10px] font-mono text-slate-300 mt-2">{estatica.map((s) => `${s.m} kg → ${s.x.toFixed(3)} m`).join(' · ')}</p>
          )}
        </div>

        {/* MÉTODO DINÁMICO */}
        <div className="bg-[#0f172a]/85 backdrop-blur-2xl border border-sky-500/30 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2"><Timer size={14} className="text-sky-400" /> Método dinámico · cronómetro</span>
          <div className="text-4xl font-black font-mono text-center my-3 tabular-nums">{formatoCrono(ms)}</div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => { audio?.playPop(); alternar(); }} className={`flex-1 py-2.5 rounded-xl font-black text-[11px] uppercase ${corriendo ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
              {corriendo ? 'Detener' : 'Iniciar'}
            </button>
            <button onClick={reiniciar} aria-label="Reiniciar cronómetro" className="px-4 bg-slate-800/60 rounded-xl border border-slate-700"><RotateCcw size={16} /></button>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oscilaciones (n)</span>
              <input type="number" min={1} value={nOsc} onChange={(e) => setNOsc(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono" />
            </label>
            <button onClick={registrarDinamica} className="h-10 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><Plus size={14} /> Registrar</button>
          </div>
          {dinamica.length > 0 && (
            <table className="w-full text-[10px] font-mono mt-3">
              <thead><tr className="text-slate-500"><th className="text-left">m</th><th className="text-left">A</th><th className="text-left">n</th><th className="text-left">t</th><th className="text-left">T</th><th /></tr></thead>
              <tbody>
                {dinamica.map((s, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td>{s.m} kg</td><td>{s.A} m</td><td>{s.n}</td><td>{s.t.toFixed(2)} s</td><td>{periodoMedido(s).toFixed(3)} s</td>
                    <td><button aria-label="Borrar muestra" onClick={() => setHooke4({ dinamica: dinamica.filter((_, k) => k !== i), resultado: null })} className="text-slate-500 hover:text-rose-400"><Trash2 size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ANÁLISIS */}
      <div className="absolute top-6 right-6 z-30 w-[300px] max-w-[92vw] bg-[#0f172a]/85 backdrop-blur-2xl border border-amber-500/30 p-5 rounded-[2rem]">
        <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em]">Análisis de rigidez</span>
        <ul className="mt-2 space-y-1 text-[10px]">
          <li className={progreso.est >= 2 ? 'text-emerald-300' : 'text-slate-400'}>• Estático: 2 masas ({progreso.est}/2)</li>
          <li className={progreso.din >= 3 ? 'text-emerald-300' : 'text-slate-400'}>• Dinámico: 3 masas ({progreso.din}/3)</li>
          <li className={progreso.amp >= 2 ? 'text-emerald-300' : 'text-slate-400'}>• Periodo con 2 amplitudes ({progreso.amp}/2)</li>
        </ul>
        <p className="text-[10px] font-mono text-slate-300 mt-3">k = m·g/x &nbsp;·&nbsp; k = 4π²m/T²</p>
        <input type="number" step="0.1" value={kInput} onChange={(e) => guardarK(e.target.value)} placeholder="k (N/m)"
          className="w-full mt-2 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono text-lg" />
        <button onClick={comprobar} className="w-full mt-3 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Comprobar análisis</button>
      </div>

      {/* CONTROLES */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-6 bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-700/50 px-6 py-4 rounded-[2rem]">
        <ControlSlider label="Carga m" value={masa} min={1} max={5} step={1} unit=" kg" locked={oscilando} onChange={(v) => setHooke4({ masa: v })} />
        <ControlSlider label="Amplitud A" value={amplitud} min={0.1} max={0.5} step={0.1} unit=" m" locked={oscilando} onChange={(v) => setHooke4({ amplitud: v })} />
        <button onClick={() => { setHooke4({ oscilando: !oscilando }); audio?.playPop(); }}
          aria-label={oscilando ? 'Detener la oscilación' : 'Estirar A y soltar'}
          className={`h-14 w-14 rounded-full flex items-center justify-center ${oscilando ? 'bg-rose-600' : 'bg-sky-600'}`}>
          {oscilando ? <Square fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
        </button>
      </div>

      <div className="absolute bottom-28 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="Tus dos métodos y tu k son coherentes. Valida tu práctica." />
      </div>
    </div>
  );
}

function ControlSlider({ label, value, min, max, step, unit, locked, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; locked?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className={`flex flex-col gap-2 min-w-[150px] ${locked ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">{locked && <Lock size={10} />}{label}</span>
        <span className="text-sm font-black text-sky-300">{value.toFixed(1)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={locked}
        onChange={(e) => onChange(Math.round(parseFloat(e.target.value) * 10) / 10)}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500 disabled:cursor-not-allowed" />
    </div>
  );
}
