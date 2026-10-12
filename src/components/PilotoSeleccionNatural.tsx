"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Bird, Activity, ShieldCheck, RefreshCcw } from 'lucide-react';
import SeleccionNatural3DScene from './simuladores/bio06/SeleccionNatural3DScene';
import { qEstimadaB6, GENERACIONES_MIN_B6, GENERACIONES_MAX_B6 } from '@/domain/biologia';

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

  return (
    <div className="w-full h-full relative bg-[#020617] overflow-hidden font-['Outfit'] text-white">
      <div className="absolute inset-0 z-0">
        <SeleccionNatural3DScene bugs={bugs} ambiente={ambiente} generacion={generacion} onHunt={handleHunt} />
      </div>

      {/* HUD superior */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start gap-4 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 max-w-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">Corteza del bosque</div>
          <div className="text-lg font-black">{ambiente === 'industrial' ? 'Ennegrecida por hollín' : 'Clara, con líquenes'}</div>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            Eres el ave: caza {cuota} polillas por generación como lo haría un depredador que busca con la vista.
            Las supervivientes se reproducen. Completa entre {GENERACIONES_MIN_B6} y {GENERACIONES_MAX_B6} generaciones.
          </p>
        </div>
        <div className="flex gap-3">
          <Dato label="Generación" value={`${generacion}`} />
          <Dato label="Cazadas" value={`${cazadas}/${cuota}`} />
          <Dato label="Fenotipo oscuro" value={`${(fOscuras * 100).toFixed(0)} %`} />
          <Dato label="q ≈ √f(claras)" value={qEst.toFixed(2)} />
        </div>
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <div className="absolute top-40 right-6 z-10 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-[11px] font-mono pointer-events-none">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Hijas de cada generación</div>
          <table>
            <thead><tr className="text-slate-500 text-[9px]"><th className="text-left pr-3">Gen</th><th className="pr-3">% oscuras</th><th>q est.</th></tr></thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.gen}><td className="pr-3">{h.gen}</td><td className="pr-3 text-center">{(h.fOscuras * 100).toFixed(0)}</td><td className="text-center">{Math.sqrt(Math.max(0, 1 - h.fOscuras)).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dock inferior */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-6">
        <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl"><Bird className="text-amber-500" size={22} /></div>
            <p className="text-[11px] text-slate-300 font-bold max-w-xs">
              {agotado ? 'Has llegado al máximo de generaciones.' : puedeCazar ? 'Haz clic sobre las polillas que alcances a ver.' : 'Cuota cumplida: deja que las supervivientes se reproduzcan.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={siguiente} disabled={cazadas < cuota || agotado}
              className="px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40">
              <Activity size={16} /> Siguiente generación
            </button>
            <button onClick={() => resetB6()}
              className="px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 bg-slate-700 hover:bg-slate-600">
              <RefreshCcw size={16} /> Nueva población
            </button>
            <button onClick={() => onValidate?.()} disabled={historial.length === 0}
              className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 disabled:opacity-40 ${status === 'success' ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-500'}`}>
              <ShieldCheck size={16} /> Validar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-right">
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="text-lg font-black font-mono">{value}</div>
    </div>
  );
}
