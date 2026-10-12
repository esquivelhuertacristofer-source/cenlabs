'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Zap, ShieldCheck, RotateCcw, Ruler } from 'lucide-react';
import type { FaseReflejo } from './simuladores/bio07/SistemaNervioso3DScene';
import { RETARDO_SINAPSIS_B7, RETARDO_PLACA_B7 } from '@/domain/biologia';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';

const SistemaNervioso3DScene = dynamic(() => import('./simuladores/bio07/SistemaNervioso3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0b1220] flex items-center justify-center text-cyan-400 font-black text-xs uppercase tracking-[0.3em]">Preparando la consulta...</div>,
});

/** 1 ms fisiológico se muestra como 60 ms en pantalla (la latencia real dura ~20-40 ms). */
const CAMARA_LENTA = 60;

export default function PilotoSistemaNervioso({ onValidate }: { onValidate?: () => void }) {
  const sistemaNervioso = useSimuladorStore((s) => s.sistemaNervioso);
  const setB7State = useSimuladorStore((s) => s.setB7State);
  const registrarGolpeB7 = useSimuladorStore((s) => s.registrarGolpeB7);
  const resetB7 = useSimuladorStore((s) => s.resetB7);
  // integridadMielina y umbral son del paciente: NO se muestran.
  const { fuerzaGolpe, distancia, ensayos, velocidadEstimada, diagnostico, status } = sistemaNervioso;

  // La animación del arco es local (no escribe en el store en cada fase).
  const [fase, setFase] = useState<FaseReflejo>({ estado: 'reposo', inicio: 0, duracion: 0 });
  const [velTexto, setVelTexto] = useState(velocidadEstimada === null ? '' : String(velocidadEstimada));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const limpiar = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => limpiar, []);

  const ocupado = fase.estado !== 'reposo';

  const golpear = () => {
    if (ocupado) return;
    limpiar();
    const ensayo = registrarGolpeB7();
    audio?.playPop();
    const pasos: [FaseReflejo['estado'], number][] = [['golpe', 300]];
    if (ensayo.respuesta && ensayo.latencia !== null) {
      const conduccion = (ensayo.latencia - RETARDO_SINAPSIS_B7 - RETARDO_PLACA_B7) * CAMARA_LENTA;
      pasos.push(
        ['viajando_sensorial', conduccion / 2],
        ['sinapsis', RETARDO_SINAPSIS_B7 * CAMARA_LENTA],
        ['viajando_motor', conduccion / 2 + RETARDO_PLACA_B7 * CAMARA_LENTA],
        ['contraccion', 700],
      );
    }
    let t = 0;
    for (const [estado, dur] of pasos) {
      const inicio = t;
      timers.current.push(setTimeout(() => setFase({ estado, inicio: performance.now(), duracion: dur }), inicio));
      t += dur;
    }
    timers.current.push(setTimeout(() => setFase({ estado: 'reposo', inicio: 0, duracion: 0 }), t));
  };

  const ultimo = ensayos[ensayos.length - 1];

  return (
    <LabLayout
      escena={<SistemaNervioso3DScene fase={fase} fuerzaGolpe={fuerzaGolpe} status={status} ultimo={ultimo ? { respuesta: ultimo.respuesta, latencia: ultimo.latencia } : null} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Martillo" valor={fuerzaGolpe} unidad="%" />
          <Lectura etiqueta="Arco" valor={distancia.toFixed(2)} unidad="m" title="Recorrido del arco: tendón → médula L3-L4 → cuádriceps" />
          {ultimo && !ocupado
            ? <Lectura acento={ultimo.respuesta} etiqueta="EMG" valor={ultimo.respuesta ? `contracción a ${ultimo.latencia?.toFixed(1)} ms del golpe` : 'sin respuesta: la pierna no se movió'} />
            : <Lectura etiqueta="EMG" valor={ocupado ? 'registrando…' : 'sin registro'} />}
        </>
      }
      tituloPanel="Paciente"
      panelLateral={
        <div className="flex flex-col gap-3 text-slate-300">
          <p className="text-[12px] leading-snug">
            Encuentra el umbral del reflejo, mide la latencia con el EMG, calcula la velocidad de conducción y decide si la mielina del paciente es normal.
          </p>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Ruler size={13} /> Datos del paciente</div>
            <div>Recorrido del arco (tendón → médula L3-L4 → cuádriceps): <b className="font-mono text-white">{distancia.toFixed(2)} m</b></div>
            <div>Retardo de la sinapsis central: <b className="font-mono text-white">{RETARDO_SINAPSIS_B7} ms</b></div>
            <div>Retardo de la placa neuromuscular: <b className="font-mono text-white">{RETARDO_PLACA_B7} ms</b></div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ensayos</span>
              <button type="button" onClick={() => { resetB7(); setVelTexto(''); }} disabled={ocupado} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"><RotateCcw size={12} /> Borrar</button>
            </div>
            {ensayos.length === 0 ? <p className="text-[11px] italic text-slate-500">Sin ensayos.</p> : (
              <table className="w-full font-mono text-[11px]">
                <thead><tr className="text-[9px] uppercase text-slate-500"><th className="text-left">#</th><th>Fuerza</th><th>Reflejo</th><th className="text-right">Latencia</th></tr></thead>
                <tbody>
                  {ensayos.map((e, i) => (
                    <tr key={i}><td>{i + 1}</td><td className="text-center">{e.fuerza} %</td><td className="text-center">{e.respuesta ? 'sí' : 'no'}</td><td className="text-right">{e.latencia === null ? '—' : `${e.latencia.toFixed(1)} ms`}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      }
      controles={
        <GrupoControles>
          <Deslizador etiqueta="Fuerza del martillo" valor={fuerzaGolpe} min={0} max={100} paso={1} unidad="%" ancho="w-48" deshabilitado={ocupado} onChange={(v) => setB7State({ fuerzaGolpe: v })} />
          <BotonLab onClick={golpear} deshabilitado={ocupado}><Zap size={14} /> {ocupado ? 'Registrando…' : 'Golpear el tendón'}</BotonLab>
          <label className="flex w-40 flex-col gap-1">
            <span className="text-[11px] font-semibold text-amber-300">Velocidad de conducción (m/s)</span>
            <input type="number" step="0.1" min="0" value={velTexto}
              onChange={(e) => {
                setVelTexto(e.target.value);
                const v = parseFloat(e.target.value);
                setB7State({ velocidadEstimada: Number.isFinite(v) && v > 0 ? v : null });
              }}
              className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-300">Diagnóstico</span>
            <div className="flex gap-1">
              {(['normal', 'desmielinizante'] as const).map((d) => (
                <button key={d} type="button" onClick={() => setB7State({ diagnostico: d })} aria-pressed={diagnostico === d}
                  className={`h-8 rounded-lg border px-2.5 text-[11px] font-semibold ${diagnostico === d ? 'border-cyan-400 bg-cyan-700/70 text-white' : 'border-white/15 bg-white/[0.04] text-slate-300 hover:text-white'}`}>
                  {d === 'normal' ? 'Conducción normal' : 'Neuropatía desmielinizante'}
                </button>
              ))}
            </div>
          </div>
          <BotonLab variante="acento" onClick={() => onValidate?.()} deshabilitado={ocupado}><ShieldCheck size={14} /> Validar práctica</BotonLab>
        </GrupoControles>
      }
    />
  );
}
