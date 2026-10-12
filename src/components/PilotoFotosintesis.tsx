"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Sun, Play, Target, RotateCcw, FlaskConical, Thermometer, ShieldCheck } from 'lucide-react';
import Fotosintesis3DScene from './simuladores/bio04/Fotosintesis3DScene';
import { NOMBRE_LUZ_B4, D_MAX_B4, DURACION_B4, ppfdB4 } from '@/domain/biologia';
import type { ColorLuzB4 } from '@/store/types';

// Solo el color de la lámpara: la eficiencia de cada longitud de onda es lo que el alumno DESCUBRE.
const LAMPARAS: { id: ColorLuzB4; hex: string }[] = [
  { id: 'blanco', hex: '#ffffff' },
  { id: 'rojo', hex: '#ef4444' },
  { id: 'amarillo', hex: '#f59e0b' },
  { id: 'verde', hex: '#22c55e' },
  { id: 'azul', hex: '#3b82f6' },
];

/** Duración visual del ensayo (s reales) que representa los 10 min de incubación. */
const DURACION_VISUAL_MS = 2500;

export default function PilotoFotosintesis({ onValidate }: { onValidate?: () => void }) {
  const fotosintesis = useSimuladorStore((s) => s.fotosintesis);
  const setFotosintesis = useSimuladorStore((s) => s.setFotosintesis);
  const registrarEnsayoB4 = useSimuladorStore((s) => s.registrarEnsayoB4);
  const resetB4 = useSimuladorStore((s) => s.resetB4);
  const { distancia, color, dMin, meta, ensayos, status } = fotosintesis;

  // La animación del ensayo es LOCAL; el store solo recibe el ensayo terminado.
  const [midiendo, setMidiendo] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const medir = () => {
    if (midiendo) return;
    setMidiendo(true);
    timer.current = setTimeout(() => {
      registrarEnsayoB4();
      setMidiendo(false);
      timer.current = null;
    }, DURACION_VISUAL_MS);
  };

  const ppfd = ppfdB4(distancia);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617] font-['Outfit'] flex flex-col">
      {/* ── ESCENA ── */}
      <div className="relative flex-1">
        <Fotosintesis3DScene simulando={midiendo} colorLuz={color} distancia={distancia} />

        <div className="absolute top-6 left-6 z-10 max-w-sm bg-black/70 backdrop-blur-xl border-l-4 border-emerald-500 p-5 rounded-r-2xl pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400"><Target size={12} /> Misión</div>
          <p className="text-sm font-bold text-white mt-2 leading-snug">
            Recoge al menos <span className="text-emerald-300 font-mono">{meta.toFixed(2)} mL</span> de O₂ en un ensayo de {DURACION_B4} min con la ramita de <i>Elodea</i>.
          </p>
          <p className="text-[11px] text-amber-300 font-bold mt-2 flex items-start gap-2">
            <Thermometer size={14} className="shrink-0 mt-0.5" />
            La lámpara calienta el agua: no la acerques a menos de {dMin} cm del tubo.
          </p>
        </div>

        {midiendo && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-black/70 border border-emerald-500/40 rounded-2xl text-[11px] font-black uppercase tracking-widest text-emerald-300">
            Incubando {DURACION_B4} min · contando burbujas…
          </div>
        )}
      </div>

      {/* ── PANEL DEL BANCO ── */}
      <div className="h-[46%] shrink-0 overflow-y-auto bg-black/60 border-t border-white/10 p-4 grid grid-cols-2 gap-4 content-start">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Sun size={14} className="text-amber-400" /> Lámpara LED (mismo flujo de fotones)</div>
          <div className="grid grid-cols-5 gap-2">
            {LAMPARAS.map((l) => (
              <button key={l.id} disabled={midiendo} title={NOMBRE_LUZ_B4[l.id]}
                onClick={() => setFotosintesis({ color: l.id })}
                className={`h-10 rounded-xl border-2 transition-all ${color === l.id ? 'border-white scale-105' : 'border-white/10 opacity-50 hover:opacity-90'}`}
                style={{ backgroundColor: l.hex }} aria-label={NOMBRE_LUZ_B4[l.id]} />
            ))}
          </div>
          <div className="text-[11px] font-bold text-white">{NOMBRE_LUZ_B4[color]}</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Distancia lámpara–tubo</span><span className="text-white font-mono">{distancia} cm</span>
          </div>
          <input type="range" min={dMin} max={D_MAX_B4} step={1} value={Math.max(dMin, distancia)} disabled={midiendo}
            onChange={(e) => setFotosintesis({ distancia: parseInt(e.target.value, 10) })}
            className="w-full accent-emerald-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
          <div className="text-[10px] text-slate-400 font-mono">Luxómetro cuántico: {ppfd.toFixed(0)} µmol·m⁻²·s⁻¹</div>
        </div>

        <button onClick={medir} disabled={midiendo}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest border-2 transition-all ${midiendo ? 'border-white/10 text-slate-500' : 'border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'}`}>
          <Play size={16} fill="currentColor" /> {midiendo ? 'Midiendo…' : `Medir ${DURACION_B4} min`}
        </button>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><FlaskConical size={14} /> Ensayos</span>
            <button onClick={() => resetB4()} disabled={midiendo} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1"><RotateCcw size={12} /> Borrar</button>
          </div>
          {ensayos.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">Sin ensayos. Cambia una variable cada vez y compara.</p>
          ) : (
            <table className="w-full text-[11px] font-mono text-slate-200">
              <thead><tr className="text-slate-500 text-[9px] uppercase"><th className="text-left">#</th><th className="text-left">Luz</th><th>cm</th><th className="text-right">O₂ (mL)</th></tr></thead>
              <tbody>
                {ensayos.map((e, i) => (
                  <tr key={i} className={e.o2 >= meta ? 'text-emerald-300' : ''}>
                    <td>{i + 1}</td><td>{NOMBRE_LUZ_B4[e.color]}</td><td className="text-center">{e.distancia}</td><td className="text-right">{e.o2.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button onClick={() => onValidate?.()} disabled={midiendo || ensayos.length === 0}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all ${ensayos.length > 0 && !midiendo ? 'bg-white text-black' : 'bg-white/5 text-slate-500'}`}>
          <ShieldCheck size={16} /> Validar práctica
        </button>
        {status === 'success' && <p className="text-[11px] font-bold text-emerald-400 text-center">Meta de O₂ alcanzada.</p>}
      </div>
    </div>
  );
}
