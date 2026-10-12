"use client";

import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { validarM2, clasificarSistemaM2 } from '@/domain/matematicas';
import { Target, RefreshCcw, ShieldCheck } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Sistemas2x23DScene from './simuladores/mat02/Sistemas2x23DScene';

export default function PilotoSistemas2x2({ onValidate }: { onValidate?: () => void }) {
  const { sistemas2x2, setSistemasCoefsM2, resetM2, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      sistemas2x2: s.sistemas2x2, setSistemasCoefsM2: s.setSistemasCoefsM2, resetM2: s.resetM2,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { m1, b1, m2, b2, target, status } = sistemas2x2;

  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido a la Central de Triangulación. Tu misión es interceptar el objetivo ajustando las pendientes de los haces láser Alpha y Omega.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Misma regla que el validador: el aviso visual nunca contradice el veredicto.
  const tipo = clasificarSistemaM2(m1, b1, m2, b2);
  const res = validarM2(sistemas2x2);
  const xi = res.interseccion ? res.interseccion.x : null;
  const yi = res.interseccion ? res.interseccion.y : null;
  const isTargetLocked = res.isOk;
  const sinUnica = tipo === 'dependiente' ? 'INFINITAS' : 'NINGUNA';

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (m1 !== 1) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (m2 !== -1 && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [m1, m2, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  const pasos = ['Láser Alpha', 'Láser Omega', 'Sincronía'];
  const ec = (m: number, b: number) => `y = ${m.toFixed(1)}x ${b >= 0 ? '+' : '−'} ${Math.abs(b).toFixed(1)}`;

  return (
    <LabLayout
      tituloPanel="Estado"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Chip color="#38bdf8" etiqueta="Alpha L1" valor={ec(m1, b1)} />
          <Chip color="#ffb703" etiqueta="Omega L2" valor={ec(m2, b2)} />
          <Lectura etiqueta="Objetivo" valor={`(${target.x}; ${target.y})`} />
          <Lectura
            etiqueta="Cruce actual"
            acento={!isTargetLocked}
            valor={xi !== null ? `(${xi.toFixed(2)}; ${yi!.toFixed(2)})` : tipo === 'dependiente' ? 'Misma recta' : 'Paralelas'}
          />
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          {pasos[Math.min(2, Math.max(0, pasoActual - 1))]} · paso {Math.max(1, pasoActual)}/3
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Sistemas2x23DScene m1={m1} b1={b1} m2={m2} b2={b2} target={target} escenario={sistemas2x2.escenario} />
        </div>
      }
      panelLateral={
        <div className="space-y-3 text-slate-300">
          <p>Ajusta la pendiente y la ordenada de cada haz hasta que las dos rectas se corten exactamente sobre el objetivo.</p>
          <p>Si las pendientes son iguales las rectas son paralelas (sin solución) o la misma recta (infinitas soluciones).</p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sky-300"><i className="inline-block h-3 w-1.5 rounded-full bg-sky-400" /> Haz Alpha (L1)</div>
              <GrupoControles>
                <Deslizador etiqueta="Pendiente (m1)" valor={m1} min={-5} max={5} paso={0.1} decimales={1} ancho="w-40" onChange={(v) => { setSistemasCoefsM2(v, b1, m2, b2); audio?.playPop(); }} />
                <Deslizador etiqueta="Ordenada (b1)" valor={b1} min={-10} max={10} paso={0.5} decimales={1} ancho="w-40" onChange={(v) => { setSistemasCoefsM2(m1, v, m2, b2); audio?.playPop(); }} />
              </GrupoControles>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300"><i className="inline-block h-3 w-1.5 rounded-full bg-amber-400" /> Haz Omega (L2)</div>
              <GrupoControles>
                <Deslizador etiqueta="Pendiente (m2)" valor={m2} min={-5} max={5} paso={0.1} decimales={1} ancho="w-40" onChange={(v) => { setSistemasCoefsM2(m1, b1, v, b2); audio?.playPop(); }} />
                <Deslizador etiqueta="Ordenada (b2)" valor={b2} min={-10} max={10} paso={0.5} decimales={1} ancho="w-40" onChange={(v) => { setSistemasCoefsM2(m1, b1, m2, v); audio?.playPop(); }} />
              </GrupoControles>
            </div>
          </div>
          <GrupoControles className="items-center">
            <BotonLab variante="secundario" title="Reiniciar las rectas (el objetivo no cambia)" onClick={() => { resetM2(); audio?.playPop(); }}>
              <RefreshCcw size={14} /> Reiniciar
            </BotonLab>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              {status === 'success' ? <ShieldCheck size={14} /> : <Target size={14} />} {status === 'success' ? 'Sincronizado' : 'Validar'}
            </BotonLab>
            {status === 'error' && (
              <span role="status" className="rounded-lg border border-rose-500/50 bg-rose-950/60 px-3 py-1.5 text-[12px] font-semibold text-rose-200">
                {tipo === 'unica' ? 'La intersección no coincide con el objetivo' : tipo === 'dependiente' ? 'Sistema dependiente: es la misma recta' : 'Sistema inconsistente: rectas paralelas'}
              </span>
            )}
          </GrupoControles>
        </div>
      }
    />
  );
}

function Chip({ color, etiqueta, valor }: { color: string; etiqueta: string; valor: string }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
      <i className="inline-block h-2 w-2 self-center rounded-full" style={{ background: color }} />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{etiqueta}</span>
      <span className="font-mono text-[13px] font-semibold tabular-nums text-white">{valor}</span>
    </div>
  );
}
