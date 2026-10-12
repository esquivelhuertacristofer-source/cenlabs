"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, MoveHorizontal, ShieldAlert, Orbit } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { CARGAS_UC, RANGO_R9_CM, K_COULOMB, evaluarF9, tipoInteraccion } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';

const Electrostatica3DScene = dynamic(() => import('./simuladores/fis09/Electrostatica3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#03040a] flex items-center justify-center text-blue-400 font-black text-xs uppercase tracking-[0.3em]">Cargando esferas...</div>
});

const fmtQ = (q: number) => `${q > 0 ? '+' : '−'}${Math.abs(q)} μC`;

export default function PilotoElectrostatica({ onValidate }: { onValidate?: () => void }) {
  const { e, setElectrostatica9, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    e: s.electrostatica9, setElectrostatica9: s.setElectrostatica9, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { q1, q2, distancia, reto, respuesta, tipoRespuesta } = e;

  const [fInput, setFInput] = useState(respuesta !== null ? String(respuesta) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF9> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      pose: 'thinking',
      text: "Bienvenido al laboratorio de electrostática. Explora cómo cambia la fuerza entre dos esferas cargadas y después resuelve el reto con la Ley de Coulomb: F = k·|q₁q₂|/r²."
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => { setVeredicto(null); }, [respuesta, tipoRespuesta]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const explorar = (data: Partial<typeof e>) => setElectrostatica9(data);

  const guardarF = (v: string) => {
    setFInput(v);
    const f = parseFloat(v);
    setElectrostatica9({ respuesta: Number.isFinite(f) ? f : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF9(e);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#03040a] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <Electrostatica3DScene q1={q1} q2={q2} distancia={distancia} isAtraccion={tipoInteraccion(q1, q2) === 'atraccion'} />
      </div>

      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} /><span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RETO */}
      <div className="absolute top-6 right-6 z-30 w-[320px] max-w-[92vw] bg-[#0A1121]/90 backdrop-blur-xl border border-amber-500/30 p-5 rounded-[2rem]">
        <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em] flex items-center gap-2"><Target size={14} /> Reto</span>
        <p className="text-[11px] text-slate-300 mt-2">Dos esferas pequeñas, tratadas como cargas puntuales:</p>
        <div className="grid grid-cols-3 gap-2 mt-2 text-center font-mono">
          <Dato label="q₁" valor={fmtQ(reto.q1)} />
          <Dato label="q₂" valor={fmtQ(reto.q2)} />
          <Dato label="r" valor={`${reto.r} cm`} />
        </div>
        <p className="text-[10px] text-slate-500 mt-2">k = {(K_COULOMB / 1e9).toFixed(3)}×10⁹ N·m²/C² · 1 μC = 10⁻⁶ C · 1 cm = 10⁻² m</p>
        <label className="block mt-3">
          <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">|F| (N)</span>
          <input type="number" step="any" value={fInput} onChange={(ev) => guardarF(ev.target.value)} placeholder="F = k·|q₁q₂|/r²"
            className="w-full mt-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono text-lg" />
        </label>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {(['atraccion', 'repulsion'] as const).map((t) => (
            <button key={t} onClick={() => setElectrostatica9({ tipoRespuesta: t, resultado: null })}
              className={`py-2 rounded-xl text-[10px] font-black uppercase ${tipoRespuesta === t ? 'bg-amber-600' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              {t === 'atraccion' ? 'Atracción' : 'Repulsión'}
            </button>
          ))}
        </div>
        <button onClick={comprobar} className="w-full mt-3 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Comprobar</button>
      </div>

      {/* EXPLORACIÓN */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0A1121]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-6 py-4 flex flex-wrap items-end justify-center gap-6 max-w-[95vw]">
        <SelectorCarga label="q₁ (izquierda)" value={q1} onChange={(v) => explorar({ q1: v })} />
        <SelectorCarga label="q₂ (derecha)" value={q2} onChange={(v) => explorar({ q2: v })} />
        <div className="flex flex-col gap-1 min-w-[200px]">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><MoveHorizontal size={12} /> Separación r</span>
            <span className="text-sm font-black text-blue-300">{distancia} cm</span>
          </div>
          <input type="range" min={RANGO_R9_CM.min} max={RANGO_R9_CM.max} step={RANGO_R9_CM.paso} value={distancia}
            onChange={(ev) => explorar({ distancia: parseFloat(ev.target.value) })} className="w-full h-1.5 accent-blue-500" />
        </div>
      </div>

      <div className="absolute top-6 left-6 z-30 max-w-[300px] bg-[#0A1121]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
        <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] flex items-center gap-2"><Orbit size={14} /> Exploración</span>
        <p className="text-[11px] text-slate-400 mt-1">Cambia cargas y distancia y observa la dirección de las fuerzas y el campo. Si duplicas r, ¿qué le pasa a la flecha?</p>
      </div>

      <div className="absolute bottom-28 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="Fuerza e interacción correctas. Valida tu práctica." />
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-[#020617] p-2 rounded-xl border border-white/5">
      <span className="text-[8px] font-black text-slate-500 uppercase block">{label}</span>
      <span className="text-xs font-black">{valor}</span>
    </div>
  );
}

function SelectorCarga({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
      <select value={value} onChange={(ev) => onChange(parseInt(ev.target.value, 10))}
        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 font-mono text-sm">
        {CARGAS_UC.map((q) => <option key={q} value={q}>{fmtQ(q)}</option>)}
      </select>
    </label>
  );
}
