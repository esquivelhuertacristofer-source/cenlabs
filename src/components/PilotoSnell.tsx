"use client";

import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { RefreshCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import { ANGULO_MIN_M7, ANGULO_MAX_M7 } from '@/domain/matematicas';
import Snell3DScene from './simuladores/mat07/Snell3DScene';

const LASER_OPTIONS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'cyan',   label: 'CYAN',   color: '#22d3ee', bg: 'bg-cyan-400' },
  { id: 'red',    label: 'ROJO',   color: '#ef4444', bg: 'bg-red-500' },
  { id: 'green',  label: 'VERDE',  color: '#22c55e', bg: 'bg-green-500' },
  { id: 'violet', label: 'UV',     color: '#8b5cf6', bg: 'bg-violet-500' },
  { id: 'white',  label: 'PRISMA', color: '#ffffff', bg: 'bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-cyan-400 to-violet-500' },
];

/**
 * MAT-07 · Ley de Snell. El alumno elige θ₁ con el slider, lee θ₂ en el
 * transportador y despeja n₂ = n₁·sen θ₁ / sen θ₂. Ningún panel muestra n₂ ni
 * una magnitud de la que salga directo (como v₂ = c/n₂).
 */
export default function PilotoSnell({ onValidate }: { onValidate?: () => void }) {
  const { optica7, setAnguloM7, setUserInputM7, audio, setAsistente } = useSimuladorStore(
    useShallow((s) => ({
      optica7: s.optica7, setAnguloM7: s.setAnguloM7, setUserInputM7: s.setUserInputM7,
      audio: s.audio, setAsistente: s.setAsistente,
    })),
  );
  const { n1, n2, n2Misterio, anguloIncidencia, status, userInputN2 } = optica7;
  // Láser monocromático por defecto: con luz blanca no hay un único θ₂ que medir.
  const [laserColor, setLaserColor] = useState<'cyan' | 'red' | 'green' | 'violet' | 'white'>('green');

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de óptica. Ajusta el ángulo de incidencia, mide el de refracción (ambos desde la normal) y despeja n₂ con la Ley de Snell.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LabLayout
      tituloPanel="Ley de Snell"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="n₁ (aire)" valor={n1.toFixed(3)} />
          <Lectura etiqueta="n₂" valor="?" acento />
          <Lectura etiqueta="θ₁" valor={`${anguloIncidencia}°`} />
          <Lectura etiqueta="θ₂" valor="mídelo en el disco" />
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Óptica · refracción en un bloque semicircular
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Snell3DScene n1={n1} n2={n2} n2Misterio={n2Misterio} anguloIncidencia={anguloIncidencia} status={status} laserColor={laserColor} />
        </div>
      }
      panelLateral={
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">Ley de Snell</span>
            <div className="border-l-2 border-cyan-400/50 pl-3 font-mono text-[13px] font-bold text-cyan-200">n₁·sen θ₁ = n₂·sen θ₂</div>
          </div>
          <p className="text-[12px] leading-snug text-slate-300">
            Los dos ángulos se miden desde la normal (la recta a rayas). Lee θ₂ en la escala del disco, donde el rayo refractado sale del bloque. Con θ₁ grande el error de lectura pesa menos al despejar n₂.
          </p>
          <p className="text-[12px] leading-snug text-slate-300">
            La luz blanca se abre en colores: con ella no hay un único θ₂ que medir. Para medir usa un láser de un solo color.
          </p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <GrupoControles className="items-center">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Láser</span>
              <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
                {LASER_OPTIONS.map((opt) => (
                  <button key={opt.id} type="button" title={opt.label} aria-label={`Láser ${opt.label}`}
                    onClick={() => { setLaserColor(opt.id as typeof laserColor); audio?.playPop(); }}
                    className={`flex h-7 w-8 items-center justify-center rounded-md ${laserColor === opt.id ? 'bg-white/15 ring-1 ring-white/60' : 'opacity-60 hover:opacity-100'}`}>
                    <i className={`block h-4 w-4 rounded ${opt.bg}`} />
                  </button>
                ))}
              </div>
            </div>
            <Deslizador etiqueta="Ángulo de incidencia θ₁" valor={anguloIncidencia} min={ANGULO_MIN_M7} max={ANGULO_MAX_M7} paso={1} unidad="°" ancho="w-52" onChange={(v) => setAnguloM7(v)} />
            <BotonLab variante="secundario" title="Reiniciar ángulo y respuesta (el medio no cambia)" onClick={() => { setAnguloM7(45); setUserInputM7(''); audio?.playPop(); }}>
              <RefreshCcw size={14} /> Reiniciar
            </BotonLab>
          </GrupoControles>
          <GrupoControles className="items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Tu valor de n₂</span>
              <input type="text" inputMode="decimal" value={userInputN2} onChange={(e) => setUserInputM7(e.target.value)} placeholder="p. ej. 1.52"
                className="h-8 w-28 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 font-mono text-[13px] font-semibold text-white outline-none focus:border-[#219EBC]" />
            </label>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              <ShieldCheck size={14} /> {status === 'success' ? 'Calibrado' : 'Calibrar / Verificar'}
            </BotonLab>
            {status === 'success' && <span role="status" className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-300"><CheckCircle2 size={14} /> n₂ correcto</span>}
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Valor incorrecto: revisa el cociente de senos.</span>}
          </GrupoControles>
        </div>
      }
    />
  );
}
