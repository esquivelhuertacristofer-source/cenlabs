"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Bird, Activity, ShieldCheck, RefreshCcw } from 'lucide-react';
import { qEstimadaB6, GENERACIONES_MIN_B6, GENERACIONES_MAX_B6 } from '@/domain/biologia';
import LabLayout, { Lectura, GrupoControles, BotonLab } from './simulador/LabLayout';

const SeleccionNatural3DScene = dynamic(() => import('./simuladores/bio06/SeleccionNatural3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0b1220] flex items-center justify-center text-emerald-400 font-black text-xs uppercase tracking-[0.3em]">Saliendo al bosque...</div>,
});

/**
 * El alumno es el ave depredadora. Cada generación caza `cuota` polillas; las
 * supervivientes se reproducen (frecuencia alélica heredada, Hardy-Weinberg) y
 * así la frecuencia cambia generación a generación. Nada en pantalla marca qué
 * polilla "conviene" cazar: el camuflaje sobre la corteza es lo único que decide.
 */
export default function PilotoSeleccionNatural({ onValidate }: { onValidate?: () => void }) {
  const evolucion = useSimuladorStore((s) => s.evolucion);
  const cazarPolilla = useSimuladorStore((s) => s.cazarPolilla);
  const finalizarGeneracion = useSimuladorStore((s) => s.finalizarGeneracion);
  const resetB6 = useSimuladorStore((s) => s.resetB6);
  const { ambiente, bugs, generacion, cuota, historial, status } = evolucion;

  const cazadas = bugs.filter((b) => b.cazada).length;
  const vivas = bugs.length - cazadas;
  const oscurasVivas = bugs.filter((b) => !b.cazada && b.tipo === 'oscura').length;
  const fOscuras = vivas > 0 ? oscurasVivas / vivas : 0;
  const qEst = qEstimadaB6(bugs);
  const agotado = historial.length >= GENERACIONES_MAX_B6;
  const puedeCazar = cazadas < cuota && !agotado;

  const handleHunt = (id: number) => {
    if (!puedeCazar) return;
    cazarPolilla(id);
    audio?.playPop();
  };

  const siguiente = () => {
    finalizarGeneracion();
    audio?.playNotification();
  };

  const mensaje = agotado
    ? 'Has llegado al máximo de generaciones.'
    : puedeCazar
      ? `Haz clic sobre las polillas que alcances a ver (${cuota - cazadas} por cazar).`
      : 'Cuota cumplida: deja que las supervivientes se reproduzcan.';

  return (
    <LabLayout
      escena={<SeleccionNatural3DScene bugs={bugs} ambiente={ambiente} generacion={generacion} onHunt={handleHunt} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Corteza" valor={ambiente === 'industrial' ? 'hollín' : 'líquenes'} title={ambiente === 'industrial' ? 'Corteza ennegrecida por hollín' : 'Corteza clara, con líquenes'} />
          <Lectura etiqueta="Gen." valor={generacion} title="Generación" />
          <Lectura etiqueta="Cazadas" valor={`${cazadas}/${cuota}`} acento={puedeCazar} />
          <Lectura etiqueta="Oscuras" valor={`${(fOscuras * 100).toFixed(0)} %`} />
          <Lectura etiqueta="q est." valor={qEst.toFixed(2)} title="q ≈ √(fracción de polillas claras)" />
        </>
      }
      tituloPanel="Población"
      panelLateral={
        <div className="flex flex-col gap-3 text-slate-300">
          <p className="text-[12px] leading-snug">
            Eres el ave: caza {cuota} polillas por generación como lo haría un depredador que busca con la vista.
            Las supervivientes se reproducen. Completa entre {GENERACIONES_MIN_B6} y {GENERACIONES_MAX_B6} generaciones.
          </p>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fenotipos vivos · gen. {generacion}</span>
            <div className="mt-2 flex h-24 items-end gap-3">
              <Barra etiqueta="Oscuras" pct={fOscuras * 100} color="#64748b" />
              <Barra etiqueta="Claras" pct={(1 - fOscuras) * 100} color="#e2e0d3" />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">Los heterocigotos Cc son oscuros: % oscuras ≠ p.</p>
          </div>
          {historial.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hijas de cada generación</span>
              <table className="mt-1 w-full font-mono text-[11px]">
                <thead><tr className="text-[9px] text-slate-500"><th className="text-left">Gen</th><th>% oscuras</th><th>q est.</th></tr></thead>
                <tbody>
                  {historial.map((h) => (
                    <tr key={h.gen}><td>{h.gen}</td><td className="text-center">{(h.fOscuras * 100).toFixed(0)}</td><td className="text-center">{Math.sqrt(Math.max(0, 1 - h.fOscuras)).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      }
      controles={
        <GrupoControles className="!items-center">
          <div className="flex min-w-[200px] flex-1 items-center gap-2.5">
            <Bird className="shrink-0 text-amber-400" size={20} />
            <p className="text-[12px] font-semibold text-slate-300">{mensaje}</p>
          </div>
          <BotonLab onClick={siguiente} deshabilitado={cazadas < cuota || agotado}><Activity size={14} /> Siguiente generación</BotonLab>
          <BotonLab variante="secundario" onClick={() => resetB6()}><RefreshCcw size={14} /> Nueva población</BotonLab>
          <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()} deshabilitado={historial.length === 0}><ShieldCheck size={14} /> Validar</BotonLab>
        </GrupoControles>
      }
    />
  );
}

function Barra({ etiqueta, pct, color }: { etiqueta: string; pct: number; color: string }) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-end">
      <span className="font-mono text-[13px] font-semibold text-white">{pct.toFixed(0)}%</span>
      <div className="w-full rounded-t-md border border-white/20" style={{ height: `${Math.max(3, pct * 0.72)}%`, background: color }} />
      <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">{etiqueta}</span>
    </div>
  );
}
