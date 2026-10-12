'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Zap, ShieldCheck, RotateCcw, Ruler } from 'lucide-react';
import SistemaNervioso3DScene, { type FaseReflejo } from './simuladores/bio07/SistemaNervioso3DScene';
import { RETARDO_SINAPSIS_B7, RETARDO_PLACA_B7 } from '@/domain/biologia';

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
    <div className="w-full h-full relative bg-[#04050d] overflow-hidden text-white font-['Outfit'] flex flex-col">
      <div className="relative flex-1">
        <SistemaNervioso3DScene fase={fase} fuerzaGolpe={fuerzaGolpe} status={status} />
        <div className="absolute top-6 left-6 z-10 bg-slate-900/70 border border-white/10 px-5 py-4 rounded-2xl backdrop-blur-xl pointer-events-none max-w-sm">
          <h4 className="text-[11px] font-black text-[#67e8f9] uppercase tracking-widest">Reflejo rotuliano · paciente en consulta</h4>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            Encuentra el umbral del reflejo, mide la latencia con el EMG, calcula la velocidad de conducción y decide si la mielina del paciente es normal.
          </p>
        </div>
        {ultimo && !ocupado && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-black/70 border border-white/10 rounded-2xl text-[12px] font-black">
            {ultimo.respuesta ? `EMG: contracción del cuádriceps a ${ultimo.latencia?.toFixed(1)} ms del golpe` : 'Sin respuesta: la pierna no se movió'}
          </div>
        )}
      </div>

      <div className="h-[46%] shrink-0 overflow-y-auto bg-black/60 border-t border-white/10 p-4 grid grid-cols-2 gap-4 content-start">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Ruler size={14} /> Datos del paciente</div>
          <div>Recorrido del arco (tendón → médula L3-L4 → cuádriceps): <b className="font-mono">{distancia.toFixed(2)} m</b></div>
          <div>Retardo de la sinapsis central: <b className="font-mono">{RETARDO_SINAPSIS_B7} ms</b></div>
          <div>Retardo de la placa neuromuscular: <b className="font-mono">{RETARDO_PLACA_B7} ms</b></div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Fuerza del martillo</span><span className="text-white font-mono">{fuerzaGolpe} %</span>
          </div>
          <input type="range" min={0} max={100} step={1} value={fuerzaGolpe} disabled={ocupado}
            onChange={(e) => setB7State({ fuerzaGolpe: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400 h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
          <button onClick={golpear} disabled={ocupado}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${ocupado ? 'bg-white/5 text-slate-500' : 'bg-[#22d3ee] text-black hover:bg-[#67e8f9]'}`}>
            <Zap size={16} /> {ocupado ? 'Registrando…' : 'Golpear el tendón'}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ensayos</span>
            <button onClick={() => { resetB7(); setVelTexto(''); }} disabled={ocupado} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1"><RotateCcw size={12} /> Borrar</button>
          </div>
          {ensayos.length === 0 ? <p className="text-[11px] text-slate-500 italic">Sin ensayos.</p> : (
            <table className="w-full text-[11px] font-mono">
              <thead><tr className="text-[9px] uppercase text-slate-500"><th className="text-left">#</th><th>Fuerza</th><th>Reflejo</th><th className="text-right">Latencia</th></tr></thead>
              <tbody>
                {ensayos.map((e, i) => (
                  <tr key={i}><td>{i + 1}</td><td className="text-center">{e.fuerza} %</td><td className="text-center">{e.respuesta ? 'sí' : 'no'}</td><td className="text-right">{e.latencia === null ? '—' : `${e.latencia.toFixed(1)} ms`}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Velocidad de conducción (m/s)
            <input type="number" step="0.1" min="0" value={velTexto}
              onChange={(e) => {
                setVelTexto(e.target.value);
                const v = parseFloat(e.target.value);
                setB7State({ velocidadEstimada: Number.isFinite(v) && v > 0 ? v : null });
              }}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400 normal-case tracking-normal" />
          </label>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnóstico</div>
          <div className="grid grid-cols-2 gap-2">
            {(['normal', 'desmielinizante'] as const).map((d) => (
              <button key={d} onClick={() => setB7State({ diagnostico: d })}
                className={`py-3 rounded-xl text-[11px] font-black border ${diagnostico === d ? 'bg-cyan-600 border-cyan-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                {d === 'normal' ? 'Conducción normal' : 'Neuropatía desmielinizante'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => onValidate?.()} disabled={ocupado}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest bg-white text-black disabled:opacity-40">
          <ShieldCheck size={16} /> Validar práctica
        </button>
      </div>
    </div>
  );
}
