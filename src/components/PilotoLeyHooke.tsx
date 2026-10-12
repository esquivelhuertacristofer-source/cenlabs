"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Timer, RotateCcw, Play, Square, ShieldAlert, Plus, Trash2, Ruler } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF4, elongacionEquilibrio, lecturaRegla, periodoMedido, OSCILACIONES_MIN } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
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
    <LabLayout
      escena={<LeyHooke3DScene k={kSemilla} masa={masa} amplitud={amplitud} isOscilando={oscilando} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Carga m" valor={masa.toFixed(0)} unidad="kg" />
          <Lectura etiqueta="Regla x" valor={oscilando ? '— oscilando —' : lectura.toFixed(3)} unidad={oscilando ? undefined : 'm'} acento={!oscilando} title="Elongación en equilibrio leída en la regla" />
          <Lectura etiqueta="Amplitud A" valor={amplitud.toFixed(1)} unidad="m" />
          <Lectura etiqueta="Cronómetro" valor={formatoCrono(ms)} acento={corriendo} />
        </>
      }
      tituloPanel="Datos y análisis"
      panelLateral={
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">Método estático · regla</div>
            {estatica.length === 0 ? <p className="text-[11px] italic text-slate-500">Sin lecturas todavía.</p> : (
              <p className="font-mono text-[11px] text-slate-200">{estatica.map((s) => `${s.m} kg → ${s.x.toFixed(3)} m`).join(' · ')}</p>
            )}
          </div>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">Método dinámico · cronómetro</div>
            {dinamica.length === 0 ? <p className="text-[11px] italic text-slate-500">Sin muestras todavía.</p> : (
              <table className="w-full font-mono text-[10px]">
                <thead><tr className="text-slate-500"><th className="text-left">m</th><th className="text-left">A</th><th className="text-left">n</th><th className="text-left">t</th><th className="text-left">T</th><th /></tr></thead>
                <tbody>
                  {dinamica.map((s, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td>{s.m}</td><td>{s.A}</td><td>{s.n}</td><td>{s.t.toFixed(2)}</td><td>{periodoMedido(s).toFixed(3)}</td>
                      <td><button aria-label="Borrar muestra" onClick={() => setHooke4({ dinamica: dinamica.filter((_, k) => k !== i), resultado: null })} className="text-slate-500 hover:text-rose-400"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ul className="space-y-1 text-[11px]">
            <li className={progreso.est >= 2 ? 'text-emerald-300' : 'text-slate-400'}>• Estático: 2 masas ({progreso.est}/2)</li>
            <li className={progreso.din >= 3 ? 'text-emerald-300' : 'text-slate-400'}>• Dinámico: 3 masas ({progreso.din}/3)</li>
            <li className={progreso.amp >= 2 ? 'text-emerald-300' : 'text-slate-400'}>• Periodo con 2 amplitudes ({progreso.amp}/2)</li>
          </ul>
          <p className="font-mono text-[11px] text-slate-300">k = m·g/x &nbsp;·&nbsp; k = 4π²m/T²</p>
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Deslizador etiqueta="Carga m" valor={masa} min={1} max={5} paso={1} unidad="kg" decimales={0} deshabilitado={oscilando} onChange={(v) => setHooke4({ masa: v })} />
            <Deslizador etiqueta="Amplitud A" valor={amplitud} min={0.1} max={0.5} paso={0.1} unidad="m" decimales={1} deshabilitado={oscilando} onChange={(v) => setHooke4({ amplitud: Math.round(v * 10) / 10 })} />
            <BotonLab onClick={() => { setHooke4({ oscilando: !oscilando }); audio?.playPop(); }} variante={oscilando ? 'acento' : 'primario'}>
              {oscilando ? <><Square fill="currentColor" size={13} /> Detener</> : <><Play fill="currentColor" size={13} /> Estirar A y soltar</>}
            </BotonLab>
            <BotonLab variante="secundario" onClick={registrarEstatica} deshabilitado={oscilando}><Ruler size={14} /> Registrar elongación</BotonLab>
          </GrupoControles>
          <GrupoControles>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
              <Timer size={14} className="text-sky-400" />
              <span className="font-mono text-[15px] font-semibold tabular-nums">{formatoCrono(ms)}</span>
              <BotonLab variante={corriendo ? 'acento' : 'secundario'} onClick={() => { audio?.playPop(); alternar(); }}>{corriendo ? 'Detener' : 'Iniciar'}</BotonLab>
              <button onClick={reiniciar} aria-label="Reiniciar cronómetro" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-slate-300 hover:text-white"><RotateCcw size={14} /></button>
            </div>
            <label className="flex w-28 flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Oscilaciones n</span>
              <input type="number" min={1} value={nOsc} onChange={(e) => setNOsc(e.target.value)} className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-[#219EBC]" />
            </label>
            <BotonLab onClick={registrarDinamica}><Plus size={14} /> Registrar periodo</BotonLab>
            <label className="flex w-32 flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">k calculada (N/m)</span>
              <input type="number" step="0.1" value={kInput} onChange={(e) => guardarK(e.target.value)} placeholder="k"
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
              <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Tus dos métodos y tu k son coherentes. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
