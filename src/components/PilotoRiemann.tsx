"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ShieldCheck, TrendingUp, Square, CheckCircle2 } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import Riemann3DScene from './simuladores/mat09/Riemann3DScene';
import {
  sumaRiemannM9, errorRelativoM9, TOLERANCIA_M9, NOMBRE_METODO_M9,
  A_M9, B_M9, N_MIN_M9, N_MAX_M9, type MetodoM9,
} from '@/domain/matematicas';

/**
 * MAT-09 · Sumas de Riemann de f(x) = 0.1·x² + 1 en [0, 10].
 * El reto (semilla) fija el MÉTODO y su tolerancia de error relativo; el alumno
 * busca la partición n que la cumple. La UI muestra el error relativo de la
 * suma elegida contra la integral exacta, con el mismo umbral que el validador.
 */
export default function PilotoRiemann({ onValidate }: { onValidate?: () => void }) {
  const { integral9, setIntegralM9, setAnimandoM9, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      integral9: s.integral9, setIntegralM9: s.setIntegralM9, setAnimandoM9: s.setAnimandoM9,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { n: nStore, metodo, metodoReto, animandoLimite, status } = integral9;
  const tol = TOLERANCIA_M9[metodoReto];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: `Bienvenido al Analizador de Riemann. Reto: aproxima el área bajo f(x) = 0.1x² + 1 en [0, 10] con ${NOMBRE_METODO_M9[metodoReto]} y un error relativo menor a ${(tol * 100).toFixed(1)} %.`,
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animación de límite n → N_MAX en estado LOCAL (20 pasos/s); el store recibe
  // la n final al terminar o al detenerla.
  const [nAnim, setNAnim] = useState(nStore);
  const nAnimRef = useRef(nStore);
  useEffect(() => {
    if (!animandoLimite) return;
    nAnimRef.current = nStore;
    setNAnim(nStore);
    const id = setInterval(() => {
      const sig = Math.min(N_MAX_M9, nAnimRef.current + 1);
      nAnimRef.current = sig;
      setNAnim(sig);
      if (sig >= N_MAX_M9) { clearInterval(id); setIntegralM9(sig, metodo); setAnimandoM9(false); }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animandoLimite]);
  const detener = () => { setIntegralM9(nAnimRef.current, metodo); setAnimandoM9(false); };
  const n = animandoLimite ? nAnim : nStore;

  const dx = (B_M9 - A_M9) / n;
  const areaApprox = sumaRiemannM9(n, metodo);
  const errRel = errorRelativoM9(n, metodo);
  const cumple = metodo === metodoReto && errRel < tol;

  useEffect(() => {
    if (nStore !== 4 && pasoActual === 0) setPasoActual(1);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [nStore, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <LabLayout
      tituloPanel="Reto"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta={`Suma (${NOMBRE_METODO_M9[metodo]})`} valor={areaApprox.toFixed(4)} acento />
          <Lectura etiqueta="Ancho Δx" valor={dx.toFixed(4)} />
          <div className={`flex shrink-0 items-baseline gap-1.5 rounded-lg border px-2 py-1 ${cumple ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-rose-400/40 bg-rose-500/10'}`}
            title={`Reto: ${NOMBRE_METODO_M9[metodoReto]} con error relativo menor a ${(tol * 100).toFixed(1)} %`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Error relativo</span>
            <span className={`font-mono text-[13px] font-semibold tabular-nums ${cumple ? 'text-emerald-300' : 'text-rose-300'}`}>{(errRel * 100).toFixed(3)} %</span>
            <span className="text-[10px] text-slate-500">meta &lt; {(tol * 100).toFixed(1)} %</span>
          </div>
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Riemann · paso {Math.max(1, pasoActual)}/3
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Riemann3DScene n={n} metodo={metodo} animandoLimite={animandoLimite} />
          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-slate-200">
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-[#f8fafc]" />f(x) = 0,1x² + 1</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-[#2fb98a]" />Rectángulos</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-[#fbbf24]" />Punto de evaluación</span>
          </div>
        </div>
      }
      panelLateral={
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-amber-300">Reto</span>
            <p className="text-[12px] font-semibold leading-snug text-white">{NOMBRE_METODO_M9[metodoReto]} · error relativo menor a {(tol * 100).toFixed(1)} %</p>
            <p className="mt-1 font-mono text-[11px] text-slate-400">f(x) = 0.1x² + 1 en [0, 10]</p>
          </div>
          <p className="text-[12px] leading-snug text-slate-300">
            Cada rectángulo mide f(x*)·Δx. Con el método del reto, busca el menor n que cumple la meta; luego pulsa Validar.
          </p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <GrupoControles className="items-end">
            <Deslizador etiqueta="Partición n" valor={n} min={N_MIN_M9} max={N_MAX_M9} paso={1} unidad="rect." ancho="w-60"
              onChange={(v) => { if (animandoLimite) setAnimandoM9(false); setIntegralM9(Math.round(v), metodo); audio?.playPop(); }} />
            <Segmentado<MetodoM9> etiqueta="Punto de evaluación" valor={metodo}
              opciones={[{ valor: 'izquierda', texto: 'Izquierda' }, { valor: 'punto_medio', texto: 'Medio' }, { valor: 'derecha', texto: 'Derecha' }]}
              onChange={(mt) => { setIntegralM9(n, mt); audio?.playPop(); }} />
          </GrupoControles>
          <GrupoControles className="items-center">
            <BotonLab variante="secundario" title="Animar n → 100" onClick={() => { if (animandoLimite) detener(); else setAnimandoM9(true); audio?.playPop(); }}>
              {animandoLimite ? <Square size={14} /> : <TrendingUp size={14} />} {animandoLimite ? 'Detener' : 'Animar n → 100'}
            </BotonLab>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => { if (animandoLimite) detener(); onValidate?.(); }}>
              {status === 'success' ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {status === 'success' ? 'Integral correcta' : 'Validar integral'}
            </BotonLab>
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Aún no cumple el reto: revisa el método y refina n.</span>}
          </GrupoControles>
        </div>
      }
    />
  );
}
