"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Target, RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  evaluarF5, fuerzaMinima, desplazamientoSalida, areaCm, G_TIERRA,
  RANGO_R1, RANGO_R2, RANGO_F1, CARRERA_ENTRADA_CM,
} from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';

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
    <LabLayout
      escena={<PrensaHidraulica3DScene y1={y1} y2={y2} r1={r1} r2={r2} masaCarga={masaCarga} f1={f1} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Carga" valor={masaCarga} unidad="kg" acento />
          <Lectura etiqueta="Presión F₁/A₁" valor={(presion / 1000).toFixed(1)} unidad="kPa" />
          <Lectura etiqueta="Carrera émbolo 1" valor={carrera.toFixed(1)} unidad="cm" />
          <Lectura etiqueta="Subida de la carga" valor={d2.toFixed(2)} unidad="cm" />
          <Lectura etiqueta="g" valor={G_TIERRA} unidad="m/s²" />
        </>
      }
      tituloPanel="Último ensayo"
      panelLateral={
        <div className="flex flex-col gap-3">
          <p className="text-[11px] leading-snug text-slate-300">
            Las dos reglas laterales miden el nivel del aceite con la misma escala (en cm): compara lo que baja el émbolo de entrada con lo que sube el de salida. El manómetro marca F₁/A₁.
          </p>
          {ensayo ? (
            <div className={`rounded-lg border p-2.5 ${veredicto?.ok ? 'border-emerald-500/40 bg-emerald-900/30' : 'border-white/10 bg-white/[0.04]'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Último ensayo</span>
              <p className="mt-1 text-[11px] text-slate-200">
                F₁ = {ensayo.f1} N → {subio ? 'la carga subió' : 'la carga NO subió'}. Predicción: {ensayo.prediccion} N.
              </p>
              {subio && <p className={`mt-1 text-[11px] font-bold ${veredicto?.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{veredicto?.ok ? 'Tu predicción de la fuerza mínima es correcta.' : veredicto?.mensaje}</p>}
            </div>
          ) : <p className="text-[11px] italic text-slate-500">Aún no hay ensayos.</p>}
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Deslizador etiqueta="Radio de entrada r₁" valor={r1} min={RANGO_R1.min} max={RANGO_R1.max} paso={RANGO_R1.paso} unidad="cm" decimales={1} onChange={(v) => ajustar({ r1: Math.round(v * 10) / 10 })} />
            <Deslizador etiqueta="Radio de salida r₂" valor={r2} min={RANGO_R2.min} max={RANGO_R2.max} paso={RANGO_R2.paso} unidad="cm" decimales={1} onChange={(v) => ajustar({ r2: Math.round(v * 10) / 10 })} />
            <Deslizador etiqueta="Fuerza aplicada F₁" valor={f1} min={RANGO_F1.min} max={RANGO_F1.max} paso={RANGO_F1.paso} unidad="N" decimales={0} onChange={(v) => ajustar({ f1: Math.round(v * 10) / 10 })} />
          </GrupoControles>
          <GrupoControles>
            <label className="flex w-48 flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">F₁ mínima que predices (N)</span>
              <input type="number" step="0.1" value={prediccion} onChange={(e) => setPrediccion(e.target.value)}
                className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[14px] outline-none focus:border-amber-400" />
            </label>
            <BotonLab onClick={bombear}><Target size={14} /> Bombear</BotonLab>
            <BotonLab variante="secundario" onClick={() => setCarrera(0)} title="Liberar la válvula"><RotateCcw size={14} /> Liberar válvula</BotonLab>
          </GrupoControles>
          {(alerta || veredicto?.ok || (ensayo && subio && !veredicto?.ok)) && (
            <div className="flex flex-wrap items-center gap-2">
              {alerta && (
                <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                  <ShieldAlert size={14} /> {alerta}
                </div>
              )}
              {ensayo && subio && !veredicto?.ok && !alerta && (
                <div className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1 text-[12px] font-bold leading-snug text-slate-200">{veredicto?.mensaje}</div>
              )}
              <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="La carga subió y tu fuerza mínima es correcta. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
