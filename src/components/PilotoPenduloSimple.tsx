"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Timer, RotateCcw, Play, Square, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF3, periodoMedido, OSCILACIONES_MIN } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
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
    <LabLayout
      escena={<PenduloSimple3DScene longitud={longitud} masa={masa} isOscilando={oscilando} gravedad={gSemilla} onOscilacion={setContador} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Longitud L" valor={longitud.toFixed(1)} unidad="m" />
          <Lectura etiqueta="Masa m" valor={masa.toFixed(0)} unidad="kg" />
          <Lectura etiqueta="Fotopuerta" valor={oscilando ? `${contador} osc.` : 'en reposo'} acento={oscilando} />
          <Lectura etiqueta="Cronómetro" valor={formatoCrono(ms)} acento={corriendo} />
          <Lectura etiqueta="Muestras" valor={muestras.length} />
        </>
      }
      tituloPanel="Muestras"
      panelLateral={
        <div className="flex flex-col gap-3">
          {muestras.length === 0 ? <p className="text-[11px] italic text-slate-500">Sin muestras todavía.</p> : (
            <table className="w-full text-[10px] font-mono">
              <thead><tr className="text-slate-500"><th className="text-left">L</th><th className="text-left">m</th><th className="text-left">n</th><th className="text-left">t</th><th className="text-left">T</th><th /></tr></thead>
              <tbody>
                {muestras.map((m, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td>{m.L}</td><td>{m.m}</td><td>{m.n}</td><td>{m.t.toFixed(2)}</td><td>{periodoMedido(m).toFixed(3)}</td>
                    <td><button aria-label="Borrar muestra" onClick={() => borrar(i)} className="text-slate-500 hover:text-rose-400"><Trash2 size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-[10px] text-slate-500">L en m, m en kg, t en s, T = t/n en s.</p>
          <ul className="space-y-1 text-[11px]">
            <li className={progreso.masaIndep ? 'text-emerald-300' : 'text-slate-400'}>• Dos masas con la misma longitud</li>
            <li className={progreso.Ls >= 3 ? 'text-emerald-300' : 'text-slate-400'}>• Tres longitudes distintas ({progreso.Ls}/3)</li>
          </ul>
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Deslizador etiqueta="Longitud L" valor={longitud} min={0.5} max={3} paso={0.5} unidad="m" decimales={1} deshabilitado={oscilando} onChange={(v) => setPendulo3({ longitud: v })} />
            <Deslizador etiqueta="Masa m" valor={masa} min={1} max={5} paso={1} unidad="kg" decimales={0} deshabilitado={oscilando} onChange={(v) => setPendulo3({ masa: v })} />
            <BotonLab onClick={() => { setPendulo3({ oscilando: !oscilando }); audio?.playPop(); }} variante={oscilando ? 'acento' : 'primario'}>
              {oscilando ? <><Square fill="currentColor" size={13} /> Detener péndulo</> : <><Play fill="currentColor" size={13} /> Soltar péndulo</>}
            </BotonLab>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
              <Timer size={14} className="text-sky-400" />
              <span className="font-mono text-[15px] font-semibold tabular-nums">{formatoCrono(ms)}</span>
              <BotonLab variante={corriendo ? 'acento' : 'secundario'} onClick={toggleCrono}>{corriendo ? 'Detener' : 'Iniciar'}</BotonLab>
              <button onClick={resetCrono} aria-label="Reiniciar cronómetro" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-slate-300 hover:text-white"><RotateCcw size={14} /></button>
            </div>
          </GrupoControles>
          <GrupoControles>
            <label className="flex w-32 flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Oscilaciones n</span>
              <input type="number" min={1} value={nOsc} onChange={(e) => setNOsc(e.target.value)}
                className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-[#219EBC]" />
            </label>
            <BotonLab onClick={registrar}><Plus size={14} /> Registrar muestra</BotonLab>
            <label className="flex w-44 flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">g calculada (m/s²)</span>
              <input type="number" step="0.01" value={gInput} onChange={(e) => guardarG(e.target.value)} placeholder="g = 4π²L/T²"
                className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
            </label>
            <BotonLab variante="acento" onClick={comprobar}>Comprobar análisis</BotonLab>
          </GrupoControles>
          {(alerta || veredicto?.ok) && (
            <div className="flex flex-wrap items-center gap-2">
              {alerta && (
                <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                  <ShieldAlert size={14} /> {alerta}
                </div>
              )}
              <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Tus muestras y tu g son coherentes. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
