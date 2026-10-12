"use client";

import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { validarM6, matrizM6, RANGO_T_M6, ESCALA_MIN_M6, ESCALA_MAX_M6 } from '@/domain/matematicas';
import { RefreshCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Transformaciones3DScene from './simuladores/mat06/Transformaciones3DScene';

/**
 * MAT-06 · Transformaciones geométricas.
 * El objetivo es la SILUETA en la rejilla (sin números): el alumno deduce
 * traslación, rotación y escala y ve en vivo la matriz M = T·R·S que aplica.
 */
export default function PilotoTransformaciones({ onValidate }: { onValidate?: () => void }) {
  const { geometria6, resetM6, setTransformM6, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      geometria6: s.geometria6, resetM6: s.resetM6, setTransformM6: s.setTransformM6,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { tx, ty, rotacion, escala, target, status } = geometria6;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al taller de transformaciones. Acopla la placa con la silueta objetivo: lee en la rejilla su posición, su giro y su tamaño, y aplica la traslación, la rotación y la escala que la producen.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Misma regla que el validador (rotación módulo 360°).
  const isTargetLocked = validarM6(geometria6);
  const M = matrizM6(tx, ty, rotacion, escala);

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (tx !== 0 || ty !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (rotacion !== 0 && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [tx, ty, rotacion, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  const fmt = (v: number) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(2).replace('-', '−');

  return (
    <LabLayout
      tituloPanel="Matriz"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="Traslación" valor={`T(${tx.toFixed(1)}; ${ty.toFixed(1)})`} acento />
          <Lectura etiqueta="Giro" valor={`${rotacion}°`} />
          <Lectura etiqueta="Escala" valor={`×${escala.toFixed(1)}`} />
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Transformaciones · paso {Math.max(1, pasoActual)}/3
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Transformaciones3DScene tx={tx} ty={ty} rotacion={rotacion} escala={escala} target={target} status={status} />
          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-slate-200">
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-3 rounded-sm border border-dashed border-slate-100 bg-white/25" />Silueta objetivo (1 cuadro = 1 unidad)</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-3 rounded-sm" style={{ background: status === 'success' ? '#34d399' : '#f59e0b' }} />Tu placa · punto = pivote</span>
          </div>
        </div>
      }
      panelLateral={
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">Tu matriz M = T·R·S</span>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 border-x-2 border-white/30 px-3 py-1 font-mono text-[13px] font-semibold tabular-nums text-white">
              {M.flat().map((v, i) => <span key={i} className="text-right">{fmt(v)}</span>)}
            </div>
          </div>
          <p className="text-[12px] leading-snug text-slate-300">
            Primero se escala, luego se gira alrededor del pivote y al final se traslada. Lee en la rejilla dónde está la silueta objetivo, hacia dónde mira y qué tan grande es.
          </p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <GrupoControles>
            <Deslizador etiqueta="Traslación X" valor={tx} min={-RANGO_T_M6} max={RANGO_T_M6} paso={0.1} decimales={1} ancho="w-44" onChange={(v) => { setTransformM6(v, ty, rotacion, escala); audio?.playPop(); }} />
            <Deslizador etiqueta="Traslación Y" valor={ty} min={-RANGO_T_M6} max={RANGO_T_M6} paso={0.1} decimales={1} ancho="w-44" onChange={(v) => { setTransformM6(tx, v, rotacion, escala); audio?.playPop(); }} />
            <Deslizador etiqueta="Rotación" valor={rotacion} min={0} max={360} paso={5} unidad="°" ancho="w-44" onChange={(v) => { setTransformM6(tx, ty, v, escala); audio?.playPop(); }} />
            <Deslizador etiqueta="Escala" valor={escala} min={ESCALA_MIN_M6} max={ESCALA_MAX_M6} paso={0.1} decimales={1} ancho="w-44" onChange={(v) => { setTransformM6(tx, ty, rotacion, v); audio?.playPop(); }} />
          </GrupoControles>
          <GrupoControles className="items-center">
            <BotonLab variante="secundario" title="Devuelve la placa al origen (el objetivo no cambia)" onClick={() => { resetM6(); audio?.playPop(); }}>
              <RefreshCcw size={14} /> Reiniciar
            </BotonLab>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              <ShieldCheck size={14} /> {status === 'success' ? 'Acoplada' : 'Validar'}
            </BotonLab>
            {isTargetLocked && status !== 'success' && (
              <span role="status" className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-300"><CheckCircle2 size={14} /> Coincide: valida tu práctica</span>
            )}
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Aún no coincide: ajusta traslación, giro y escala.</span>}
          </GrupoControles>
        </div>
      }
    />
  );
}
