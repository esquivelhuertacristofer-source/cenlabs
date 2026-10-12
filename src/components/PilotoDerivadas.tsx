"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ShieldCheck, Play, Pause, CheckCircle2 } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Derivadas3DScene from './simuladores/mat08/Derivadas3DScene';
import { posicionM8, velocidadM8, T_MAX_M8 } from '@/domain/matematicas';

/**
 * MAT-08 · La derivada. Telemetría de un cohete: s(t) = −k·t³ + m·t² (dato).
 * La recta tangente de la escena tiene pendiente v(t) = s'(t). El reto es marcar
 * el instante de VELOCIDAD MÁXIMA: donde v'(t) = a(t) = 0 (inflexión de s).
 * El instante marcado se escribe en el store (`derivada8.xActual`), que es lo
 * que lee el validador; la animación corre en estado local.
 */
export default function PilotoDerivadas({ onValidate }: { onValidate?: () => void }) {
  const { derivada8, setXActualM8, setAsistente } = useSimuladorStore(
    useShallow((s) => ({ derivada8: s.derivada8, setXActualM8: s.setXActualM8, setAsistente: s.setAsistente })),
  );
  const { status, k, m, xActual } = derivada8;
  const cohete = { k, m };

  const [t, setT] = useState(xActual);
  const tRef = useRef(xActual);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Centro de Control. Encuentra el instante de MÁXIMA VELOCIDAD del cohete: la velocidad es la derivada de la posición, y es máxima donde su propia derivada se anula.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el store cambia desde fuera (reinicio, bitácora), el cursor lo sigue.
  useEffect(() => { if (!isPlaying) { tRef.current = xActual; setT(xActual); } }, [xActual, isPlaying]);

  // -- ANIMACIÓN (local, requestAnimationFrame; 1 s de vuelo por segundo real) --
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0, prev = performance.now();
    const paso = (now: number) => {
      let nt = tRef.current + (now - prev) / 1000;
      prev = now;
      if (nt > T_MAX_M8) nt = 0;
      tRef.current = nt;
      setT(nt);
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  const marcar = (nt: number) => { tRef.current = nt; setT(nt); setXActualM8(Math.round(nt * 100) / 100); };
  const togglePlay = () => {
    if (isPlaying) { setIsPlaying(false); setXActualM8(Math.round(tRef.current * 100) / 100); }
    else setIsPlaying(true);
  };
  const validar = () => {
    setIsPlaying(false);
    setXActualM8(Math.round(tRef.current * 100) / 100);
    onValidate?.();
  };

  const currentS = posicionM8(cohete, t);
  const currentV = velocidadM8(cohete, t);

  if (!mounted) return null;

  const fmt = (v: number) => v.toFixed(2).replace('-', '−');
  return (
    <LabLayout
      tituloPanel="Derivada"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="s(t)" valor={`−${k}·t³ + ${m}·t²`} acento />
          <Lectura etiqueta="t" valor={fmt(t)} unidad="s" />
          <Lectura etiqueta="Posición" valor={fmt(currentS)} unidad="m" />
          <Lectura etiqueta="Velocidad v = s′(t)" valor={fmt(currentV)} unidad="m/s" />
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Telemetría del cohete · derivada como límite
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Derivadas3DScene t={t} coef={cohete} />
          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-slate-200">
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: '#22d3ee' }} />Posición s(t)</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: '#f472b6' }} />Tangente (pendiente = v)</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: '#fbbf24' }} />Secante con h → 0</span>
          </div>
        </div>
      }
      panelLateral={
        <div className="space-y-3">
          <p className="text-[12px] leading-snug text-slate-300">
            La pendiente de la tangente en cada instante es la velocidad v(t) = s′(t). La secante se acerca a ella cuando h → 0.
          </p>
          <p className="text-[12px] leading-snug text-slate-300">
            Reto: marca el instante de velocidad máxima. Mueve t y mira cómo cambia la pendiente de la tangente; recuerda que v es máxima donde su propia derivada se anula.
          </p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <GrupoControles className="items-end">
            <Deslizador etiqueta="Instante marcado t" valor={t} min={0} max={T_MAX_M8} paso={0.01} decimales={2} unidad="s" ancho="w-72"
              onChange={(v) => { setIsPlaying(false); marcar(v); }} />
            <BotonLab variante="secundario" title={isPlaying ? 'Pausar el vuelo' : 'Reproducir el vuelo'} onClick={togglePlay}>
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? 'Pausar' : 'Reproducir'}
            </BotonLab>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={validar}>
              {status === 'success' ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {status === 'success' ? 'Instante correcto' : 'Validar telemetría'}
            </BotonLab>
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Ese no es el instante de velocidad máxima.</span>}
          </GrupoControles>
        </div>
      }
    />
  );
}
