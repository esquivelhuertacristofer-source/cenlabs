"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Gauge, ShieldAlert, Target, RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  evaluarF5, fuerzaMinima, desplazamientoSalida, areaCm, G_TIERRA,
  RANGO_R1, RANGO_R2, RANGO_F1, CARRERA_ENTRADA_CM,
} from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';

const PrensaHidraulica3DScene = dynamic(() => import('./simuladores/fis05/PrensaHidraulica3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Cargando Sistemas Hidráulicos...</div>
});

// Niveles del fluido en la escena (fracción de la altura del cilindro). Ambos
// cilindros usan la MISMA escala de altura, así que A₁·Δh₁ = A₂·Δh₂ también se ve.
const NIVEL_REPOSO_1 = 0.6;
const NIVEL_REPOSO_2 = 0.3;
const ESCALA = 0.4 / CARRERA_ENTRADA_CM; // fracción por cm

export default function PilotoPrensaHidraulica({ onValidate }: { onValidate?: () => void }) {
  const { prensa5, setPrensa5, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    prensa5: s.prensa5, setPrensa5: s.setPrensa5, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { masaCarga, r1, r2, f1, ensayo } = prensa5;

  const [prediccion, setPrediccion] = useState(prensa5.prediccion !== null ? String(prensa5.prediccion) : '');
  const [carrera, setCarrera] = useState(0); // cm recorridos por el émbolo de entrada en el último bombeo
  const [alerta, setAlerta] = useState<string | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al taller hidráulico. Calcula la fuerza MÍNIMA en el émbolo pequeño que sostiene la carga (la presión es la misma en todo el fluido) y compruébala bombeando.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  // Cambiar la configuración devuelve los émbolos a su posición de reposo.
  const ajustar = (data: Partial<typeof prensa5>) => { setPrensa5({ ...data, resultado: null }); setCarrera(0); };

  const bombear = () => {
    const p = parseFloat(prediccion);
    if (!Number.isFinite(p)) {
      audio?.playError();
      return avisar('Escribe tu predicción de la fuerza mínima antes de bombear.');
    }
    const nuevo = { r1, r2, f1, prediccion: p, masaCarga };
    setPrensa5({ prediccion: p, ensayo: nuevo, resultado: null });
    const sube = f1 >= fuerzaMinima(masaCarga, r1, r2);
    setCarrera(sube ? CARRERA_ENTRADA_CM : 0);
    if (sube) audio?.playPop(); else { audio?.playError(); avisar('La carga no se movió: la presión no alcanza para sostener su peso.'); }
  };

  const presion = f1 / areaCm(r1); // Pa
  const d2 = desplazamientoSalida(carrera, r1, r2);
  const y1 = NIVEL_REPOSO_1 - carrera * ESCALA;
  const y2 = NIVEL_REPOSO_2 + d2 * ESCALA;

  // Feedback del último ensayo con la MISMA regla del validador.
  const veredicto = useMemo(() => (ensayo ? evaluarF5({ ensayo }) : null), [ensayo]);
  const subio = !!ensayo && ensayo.f1 >= fuerzaMinima(ensayo.masaCarga, ensayo.r1, ensayo.r2);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <PrensaHidraulica3DScene y1={y1} y2={y2} r1={r1} r2={r2} />
      </div>

      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} /><span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MANÓMETRO Y RESULTADO */}
      <div className="absolute top-6 left-6 z-30 w-[290px] max-w-[44%] flex flex-col gap-4">
        <div className="bg-[#0f172a]/85 backdrop-blur-2xl border border-sky-500/30 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-sky-500/20 rounded-xl"><Gauge className="text-sky-400" size={20} /></div>
            <span className="text-[11px] font-black text-sky-300 uppercase tracking-[0.2em]">Manómetro</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presión con F₁ aplicada</span>
            <span className="text-3xl font-black font-mono">{(presion / 1000).toFixed(1)} <span className="text-xs text-slate-400">kPa</span></span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <Dato label="Carrera émbolo 1" valor={`${carrera.toFixed(1)} cm`} />
            <Dato label="Subida de la carga" valor={`${d2.toFixed(2)} cm`} />
          </div>
        </div>
        {ensayo && (
          <div className={`p-5 rounded-[2rem] border backdrop-blur-xl ${veredicto?.ok ? 'bg-emerald-900/40 border-emerald-500/40' : 'bg-[#0f172a]/80 border-white/10'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Último ensayo</span>
            <p className="text-xs text-slate-200 mt-2">
              F₁ = {ensayo.f1} N → {subio ? 'la carga subió' : 'la carga NO subió'}. Predicción: {ensayo.prediccion} N.
            </p>
            {subio && <p className={`text-[11px] font-bold mt-1 ${veredicto?.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{veredicto?.ok ? 'Tu predicción de la fuerza mínima es correcta.' : veredicto?.mensaje}</p>}
          </div>
        )}
      </div>

      {/* CONFIGURACIÓN */}
      <div className="absolute top-6 right-6 z-40 w-[320px] max-w-[48%]">
        <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-700/50 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
            <Settings2 className="text-amber-400" size={22} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Prensa</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            <Dato label="Masa de la carga" valor={`${masaCarga} kg`} />
            <Dato label="g" valor={`${G_TIERRA} m/s²`} />
          </div>
          <div className="space-y-5">
            <ControlSlider label="Radio de entrada r₁" value={r1} r={RANGO_R1} unit="cm" decimales={1} onChange={(v) => ajustar({ r1: v })} />
            <ControlSlider label="Radio de salida r₂" value={r2} r={RANGO_R2} unit="cm" decimales={1} onChange={(v) => ajustar({ r2: v })} />
            <ControlSlider label="Fuerza aplicada F₁" value={f1} r={RANGO_F1} unit="N" decimales={0} onChange={(v) => ajustar({ f1: v })} />
          </div>
          <label className="block mt-5">
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">F₁ mínima que predices (N)</span>
            <input type="number" step="0.1" value={prediccion} onChange={(e) => setPrediccion(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono text-lg" />
          </label>
          <div className="flex gap-2 mt-4">
            <button onClick={bombear} className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 active:scale-95">
              <Target size={18} /> Bombear
            </button>
            <button onClick={() => setCarrera(0)} aria-label="Liberar la válvula" className="px-4 bg-slate-800 hover:bg-slate-700 rounded-2xl"><RotateCcw size={18} /></button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="La carga subió y tu fuerza mínima es correcta. Valida tu práctica." />
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-[#020617] p-2.5 rounded-xl border border-white/5">
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">{label}</span>
      <span className="text-sm font-black font-mono">{valor}</span>
    </div>
  );
}

function ControlSlider({ label, value, r, unit, decimales, onChange }: {
  label: string; value: number; r: { min: number; max: number; paso: number }; unit: string; decimales: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-lg font-black">{value.toFixed(decimales)} {unit}</span>
      </div>
      <input type="range" min={r.min} max={r.max} step={r.paso} value={value}
        onChange={(e) => onChange(Math.round(parseFloat(e.target.value) * 10) / 10)}
        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500" />
    </div>
  );
}
