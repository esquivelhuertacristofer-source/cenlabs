'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { FlaskConical, Play, ShieldCheck, RotateCcw, Droplet } from 'lucide-react';
import { ENZIMAS_B9, MACRONUTRIENTES_B9, ORGANOS_B9 } from '@/domain/biologia';
import type { EnzimaB9, OrganoB9, IncubacionB9 } from '@/store/types';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';

const SistemaDigestivo3DScene = dynamic(() => import('./simuladores/bio09/SistemaDigestivo3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0b1220] flex items-center justify-center text-rose-400 font-black text-xs uppercase tracking-[0.3em]">Preparando el banco...</div>,
});

const ENZIMAS: EnzimaB9[] = ['amilasa', 'pepsina', 'tripsina', 'lipasa'];
const ORGANOS: OrganoB9[] = ['boca', 'estomago', 'delgado', 'grueso'];
const INDICADOR: Record<string, string> = { almidon: 'Lugol', proteina: 'Biuret', lipido: 'fenolftaleína' };

function describirEnsayo(e: IncubacionB9): string {
  const pct = Math.round(e.hidrolisis * 100);
  switch (e.resultado) {
    case 'sin_reaccion': return 'Sin hidrólisis: el sustrato quedó intacto, igual que el tubo control sin enzima.';
    case 'desnaturalizada': return 'Sin hidrólisis y la enzima precipitó: perdió su estructura de forma irreversible.';
    case 'parcial': return `Hidrólisis parcial: se degradó el ${pct} % del sustrato en 30 min.`;
    default: return `Hidrólisis completa: se degradó el ${pct} % del sustrato en 30 min.`;
  }
}

export default function PilotoSistemaDigestivo({ onValidate }: { onValidate?: () => void }) {
  const digestion = useSimuladorStore((s) => s.digestion);
  const setDigestion = useSimuladorStore((s) => s.setDigestion);
  const incubarB9 = useSimuladorStore((s) => s.incubarB9);
  const resetB9 = useSimuladorStore((s) => s.resetB9);
  const { macronutriente, enzimaSeleccionada, nivelPH, bilis, ensayo, organoRespuesta, absorcionRespuesta, status } = digestion;

  const [incubando, setIncubando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const incubar = () => {
    if (!enzimaSeleccionada || incubando) return;
    setIncubando(true);
    audio?.playPop();
    timer.current = setTimeout(() => {
      incubarB9();
      setIncubando(false);
      timer.current = null;
    }, 1500);
  };

  const sustrato = MACRONUTRIENTES_B9[macronutriente];

  return (
    <LabLayout
      escena={
        <SistemaDigestivo3DScene
          macronutriente={macronutriente}
          enzima={enzimaSeleccionada}
          nivelPH={nivelPH}
          bilis={bilis}
          ensayo={ensayo}
          incubando={incubando}
          organoRespuesta={organoRespuesta}
          absorcionRespuesta={absorcionRespuesta}
          absorbiendo={status === 'success'}
        />
      }
      barraSuperior={
        <>
          <Lectura etiqueta="Sustrato" valor={`${sustrato.nombre} · ${sustrato.alimento}`} />
          <Lectura etiqueta="Indicador" valor={INDICADOR[macronutriente]} />
          <Lectura etiqueta="Baño" valor="37 °C" />
          {incubando && <Lectura etiqueta="Estado" valor="Incubando 30 min…" acento />}
          {status === 'success' && <Lectura etiqueta="Resultado" valor="Digestión y absorción correctas" acento />}
        </>
      }
      tituloPanel="Resultados"
      panelLateral={
        <div className="flex flex-col gap-3 text-slate-300">
          <p className="flex gap-2 text-[12px] leading-snug"><FlaskConical size={16} className="mt-0.5 shrink-0 text-rose-300" />
            Encuentra la enzima y las condiciones que hidrolizan por completo {sustrato.alimento}, y en qué órgano ocurre.</p>
          {ensayo ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-[12px] space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Último tubo: {ENZIMAS_B9[ensayo.enzima].nombre} · pH {ensayo.pH.toFixed(1)} · {ensayo.bilis ? 'con' : 'sin'} bilis</div>
              <div className="font-semibold text-slate-100">{describirEnsayo(ensayo)}</div>
            </div>
          ) : <p className="text-[11px] italic text-slate-500">Aún no hay tubos incubados.</p>}
          <p className="text-[10px] text-slate-500">En el modelo del aparato digestivo verás marcado el órgano de tu respuesta 4 y, en la lupa, la pared del órgano que elijas en la 5.</p>
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
        <GrupoControles>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-300">1 · Enzima</span>
            <div className="flex flex-wrap gap-1">
              {ENZIMAS.map((e) => (
                <button key={e} type="button" disabled={incubando} onClick={() => setDigestion({ enzimaSeleccionada: e })} aria-pressed={enzimaSeleccionada === e}
                  className={`h-8 rounded-lg border px-2.5 text-[11px] font-semibold ${enzimaSeleccionada === e ? 'border-[#219EBC] bg-[#219EBC] text-white' : 'border-white/15 bg-white/[0.04] text-slate-300 hover:text-white'}`}>
                  {ENZIMAS_B9[e].nombre}
                </button>
              ))}
            </div>
          </div>
          <Deslizador etiqueta="2 · pH del tampón" valor={nivelPH} min={1} max={12} paso={0.5} decimales={1} ancho="w-44" deshabilitado={incubando} onChange={(v) => setDigestion({ nivelPH: v })} />
          <BotonLab variante={bilis ? 'acento' : 'secundario'} deshabilitado={incubando} onClick={() => setDigestion({ bilis: !bilis })}><Droplet size={14} /> {bilis ? 'Con sales biliares' : 'Sin sales biliares'}</BotonLab>
          <BotonLab onClick={incubar} deshabilitado={!enzimaSeleccionada || incubando}><Play size={14} /> 3 · Incubar 30 min</BotonLab>
          <BotonLab variante="secundario" onClick={() => resetB9()} deshabilitado={incubando} title="Nuevo ejercicio"><RotateCcw size={14} /> Reiniciar</BotonLab>
          <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()} deshabilitado={incubando || !ensayo}><ShieldCheck size={14} /> Validar práctica</BotonLab>
        </GrupoControles>
        <GrupoControles>
          <label className="flex w-60 flex-col gap-1">
            <span className="text-[11px] font-semibold text-amber-300">4 · ¿En qué órgano actúa la enzima de tu último tubo?</span>
            <select value={organoRespuesta ?? ''} onChange={(e) => setDigestion({ organoRespuesta: (e.target.value || null) as OrganoB9 | null })}
              className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-[12px] text-white">
              <option value="">—</option>
              {ORGANOS.map((o) => <option key={o} value={o}>{ORGANOS_B9[o]}</option>)}
            </select>
          </label>
          <label className="flex w-60 flex-col gap-1">
            <span className="text-[11px] font-semibold text-amber-300">5 · ¿Dónde se absorben los productos ({sustrato.monomero})?</span>
            <select value={absorcionRespuesta ?? ''} onChange={(e) => setDigestion({ absorcionRespuesta: (e.target.value || null) as OrganoB9 | null })}
              className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 text-[12px] text-white">
              <option value="">—</option>
              {ORGANOS.map((o) => <option key={o} value={o}>{ORGANOS_B9[o]}</option>)}
            </select>
          </label>
        </GrupoControles>
        </div>
      }
    />
  );
}
