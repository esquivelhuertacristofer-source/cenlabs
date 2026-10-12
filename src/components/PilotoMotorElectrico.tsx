"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Gauge, Target, ShieldAlert, Magnet } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { MOTOR, ESPIRAS10, RANGO_V10, estadoMotor, evaluarF10, type Polo } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';

const MotorElectrico3DScene = dynamic(() => import('./simuladores/fis10/MotorElectrico3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#03040a] flex items-center justify-center text-orange-400 font-black text-xs uppercase tracking-[0.3em]">Montando motor...</div>
});

export default function PilotoMotorElectrico({ onValidate }: { onValidate?: () => void }) {
  const { m, setMotor10, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    m: s.motor10, setMotor10: s.setMotor10, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { imanIzq, imanDer, voltaje, espiras, carga, encendido, reto, vPrediccion, ensayo } = m;

  const [vInput, setVInput] = useState(vPrediccion !== null ? String(vPrediccion) : '');
  const [alerta, setAlerta] = useState<string | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de electromecánica. Coloca los imanes para que su campo atraviese la bobina, elige el bobinado y predice el voltaje que da la velocidad pedida con la carga del freno.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  // Cualquier cambio de configuración desenergiza: cada arranque es un ensayo.
  const ajustar = (data: Partial<typeof m>) => setMotor10({ ...data, encendido: false, resultado: null });

  const est = useMemo(() => estadoMotor({ voltaje, espiras, imanIzq, imanDer, carga }), [voltaje, espiras, imanIzq, imanDer, carga]);
  const rpmVisible = encendido ? est.rpm : 0;

  const guardarV = (v: string) => {
    setVInput(v);
    const x = parseFloat(v);
    setMotor10({ vPrediccion: Number.isFinite(x) ? x : null, resultado: null });
  };

  const energizar = () => {
    if (encendido) { setMotor10({ encendido: false }); audio?.playPop(); return; }
    if (vPrediccion === null) { audio?.playError(); return avisar('Escribe primero el voltaje que predices para el reto.'); }
    setMotor10({ encendido: true, ensayo: { voltaje, espiras, imanIzq, imanDer, carga, vPrediccion }, resultado: null });
    if (est.sinCampo) avisar('Con dos polos iguales enfrentados no hay campo que atraviese la bobina: el rotor no gira.');
    else if (!est.arranca) avisar('El rotor no arranca: el par motor no vence al de la carga con este voltaje.');
    audio?.playPop();
  };

  const veredicto = useMemo(() => (ensayo ? evaluarF10({ reto, ensayo }) : null), [ensayo, reto]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <MotorElectrico3DScene imanIzq={imanIzq} imanDer={imanDer} espiras={espiras} rpm={rpmVisible}
          corriente={encendido ? est.corriente : 0} encendido={encendido} />
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
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Dato label="Velocidad" valor={`${reto.rpmObjetivo} rpm`} />
          <Dato label="Sentido" valor={reto.sentido} />
          <Dato label="Par de carga" valor={`${reto.carga} N·m`} />
        </div>
        <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
          Imanes: B = {MOTOR.B} T · Bobina: A = {(MOTOR.A * 1e4).toFixed(0)} cm² · R = {MOTOR.rEspira} Ω por espira.
          Sentido visto desde el conmutador.
        </p>
        <label className="block mt-3">
          <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">Voltaje que predices (V)</span>
          <input type="number" step="0.1" value={vInput} onChange={(e) => guardarV(e.target.value)} placeholder="V = k·ω + I·Rₐ" disabled={encendido}
            className="w-full mt-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono text-lg disabled:opacity-50" />
        </label>
      </div>

      {/* INSTRUMENTOS */}
      <div className="absolute top-6 left-6 z-30 w-[300px] max-w-[92vw] flex flex-col gap-4">
        <div className="bg-[#0A1121]/90 backdrop-blur-xl border border-emerald-500/30 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] flex items-center gap-2"><Gauge size={14} /> Tacómetro y amperímetro</span>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Dato label="Velocidad" valor={encendido ? `${Math.round(Math.abs(rpmVisible))} rpm` : '—'} />
            <Dato label="Sentido" valor={encendido && rpmVisible !== 0 ? (rpmVisible > 0 ? 'horario' : 'antihorario') : '—'} />
            <Dato label="Corriente" valor={encendido ? `${est.corriente.toFixed(2)} A` : '—'} />
            <Dato label="Tensión" valor={`${voltaje.toFixed(1)} V`} />
          </div>
        </div>
        {ensayo && (
          <div className={`p-4 rounded-[1.5rem] border backdrop-blur-xl text-[11px] ${veredicto?.ok ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-200' : 'bg-[#0A1121]/85 border-white/10 text-slate-200'}`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Último arranque</span>
            <p className="mt-1">{ensayo.voltaje.toFixed(1)} V · N = {ensayo.espiras} · imanes {ensayo.imanIzq}–{ensayo.imanDer} · predicción {ensayo.vPrediccion} V</p>
            <p className="mt-1 font-bold">{veredicto?.ok ? 'Velocidad, sentido y predicción correctos.' : veredicto?.mensaje}</p>
          </div>
        )}
      </div>

      {/* CONTROLES */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0A1121]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-6 py-4 flex flex-wrap items-end justify-center gap-6 max-w-[95vw]">
        <SelectorPolo label="Imán izquierdo" value={imanIzq} onChange={(p) => ajustar({ imanIzq: p })} />
        <SelectorPolo label="Imán derecho" value={imanDer} onChange={(p) => ajustar({ imanDer: p })} />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Espiras N</span>
          <div className="flex gap-1">
            {ESPIRAS10.map((n) => (
              <button key={n} onClick={() => ajustar({ espiras: n })}
                className={`w-12 h-9 rounded-xl text-[10px] font-black ${espiras === n ? 'bg-orange-600' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{n}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Fuente de CD</span>
            <span className="text-sm font-black text-orange-300">{voltaje.toFixed(1)} V</span>
          </div>
          <input type="range" min={RANGO_V10.min} max={RANGO_V10.max} step={RANGO_V10.paso} value={voltaje}
            onChange={(e) => ajustar({ voltaje: Math.round(parseFloat(e.target.value) * 10) / 10 })} className="w-full h-1.5 accent-orange-500" />
        </div>
        <button onClick={energizar}
          className={`h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 ${encendido ? 'bg-emerald-600' : 'bg-white/10 hover:bg-white/20'}`}>
          <Power size={16} /> {encendido ? 'Cortar energía' : 'Energizar'}
        </button>
      </div>

      <div className="absolute bottom-28 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="El motor cumple el reto y tu predicción es correcta. Valida tu práctica." />
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-[#020617] p-2 rounded-xl border border-white/5">
      <span className="text-[8px] font-black text-slate-500 uppercase block">{label}</span>
      <span className="text-xs font-black font-mono">{valor}</span>
    </div>
  );
}

function SelectorPolo({ label, value, onChange }: { label: string; value: Polo; onChange: (p: Polo) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1"><Magnet size={12} /> {label}</span>
      <div className="flex gap-1">
        {(['N', 'S'] as const).map((p) => (
          <button key={p} onClick={() => onChange(p)} aria-label={`${label}: polo ${p} hacia la bobina`}
            className={`w-10 h-9 rounded-xl text-[11px] font-black ${value === p ? (p === 'N' ? 'bg-red-600' : 'bg-blue-600') : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{p}</button>
        ))}
      </div>
    </div>
  );
}
