"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, ShieldCheck, RefreshCcw, BookOpen, Pi, CheckCircle2 } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Cuadraticas3DScene from './simuladores/mat01/Cuadraticas3DScene';
import {
  solveQuadratic, formatQuadratic,
  getEquivalentForms, getDomainRangeInfo,
} from '@/utils/mathEngine';
import { puntosObjetivoM1 } from '@/domain/matematicas';
import { audio as audioEngine } from '@/utils/audioEngine';

/**
 * MAT-01 · Deducir f(x) = ax² + bx + c de una trayectoria.
 * El objetivo NO se muestra como ecuación: el alumno recibe tres puntos medidos
 * (x = −1, 0, 1) y la curva guía, y tiene que deducir a, b y c. Δ y el vértice
 * se comprueban en la bitácora (consola de cálculo). El veredicto lo da el
 * validador del store vía `onValidate` (botón del header o el de este panel).
 */
export default function PilotoCuadraticas({ onValidate }: { onValidate?: () => void }) {
  const { cuadraticas, setCoefsM1, registrarHallazgoM1, resetM1, setAsistente, pasoActual, setPasoActual, bitacoraData, setBitacora, stopTimer } = useSimuladorStore(
    useShallow((s) => ({
      cuadraticas: s.cuadraticas, setCoefsM1: s.setCoefsM1, registrarHallazgoM1: s.registrarHallazgoM1, resetM1: s.resetM1,
      setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
      bitacoraData: s.bitacoraData, setBitacora: s.setBitacora, stopTimer: s.stopTimer,
    })),
  );
  const { a, b, c, target, status } = cuadraticas;

  const calcReady = (cuadraticas.deltaVerified ?? false) && (cuadraticas.vertexVerified ?? false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Explorador de Cuadráticas. Tienes tres puntos medidos de la trayectoria objetivo: deduce a, b y c y ajusta tu parábola para que pase por ellos.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- MOTOR MATEMÁTICO --
  const currentRes  = useMemo(() => solveQuadratic(a, b, c), [a, b, c]);
  const currentEq   = useMemo(() => formatQuadratic(a, b, c), [a, b, c]);
  const forms       = useMemo(() => getEquivalentForms(a, b, c, currentRes.vertex, currentRes.roots), [a, b, c, currentRes]);
  const domainInfo  = useMemo(() => getDomainRangeInfo(a, b, currentRes.vertex.k, c), [a, b, currentRes.vertex.k, c]);
  const puntos      = useMemo(() => puntosObjetivoM1(target), [target]);

  const { h: vh, k: vk } = currentRes.vertex;

  // -- GEOMETRÍA DE LA PARÁBOLA: parámetro focal p = 1/4a --
  const focusReady = Math.abs(a) >= 0.06;
  const p = 1 / (4 * (Math.abs(a) < 1e-6 ? 1e-6 : a));
  const focusY = vk + p;
  const directrixY = vk - p;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (a !== 1 || b !== 0 || c !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (calcReady && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) {
      setPasoActual(3);
      stopTimer();
      registrarHallazgoM1();
    }
  }, [a, b, c, calcReady, status, pasoActual, setPasoActual, stopTimer, registrarHallazgoM1]);

  if (!mounted) return null;

  const CONTEXTO: Record<string, string> = {
    lanzamiento_proyectil: 'Trayectoria de un proyectil',
    arquitectura_arco: 'Arco estructural',
    focalizacion_antena: 'Antena parabólica',
    parabola_basica: 'Plano cartesiano',
  };

  return (
    <LabLayout
      tituloPanel="Formas"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="Tu f(x)" valor={currentEq} acento />
          <Lectura etiqueta="Foco" valor={focusReady ? `(${vh.toFixed(1)}; ${focusY.toFixed(1)})` : '—'} />
          <Lectura etiqueta="Directriz" valor={focusReady ? `y = ${directrixY.toFixed(1)}` : '—'} />
          {puntos.map((pt) => {
            const tuyo = a * pt.x * pt.x + b * pt.x + c;
            const ok = Math.abs(tuyo - pt.y) < 0.05;
            return (
              <div key={pt.x} title={`En x = ${pt.x}: medida ${pt.y.toFixed(1)}, tu parábola ${tuyo.toFixed(1)}`}
                className={`flex shrink-0 items-baseline gap-1.5 rounded-lg border px-2 py-1 ${ok ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-[#FB8500]/40 bg-[#FB8500]/10'}`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">x = {pt.x}</span>
                <span className="font-mono text-[13px] font-semibold tabular-nums text-[#FFB703]">{pt.y.toFixed(1)}</span>
                <span className="text-[10px] text-slate-500">medida</span>
                <span className={`font-mono text-[13px] font-semibold tabular-nums ${ok ? 'text-emerald-300' : 'text-white'}`}>{tuyo.toFixed(1)}</span>
                <span className="text-[10px] text-slate-500">tuya</span>
              </div>
            );
          })}
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          {CONTEXTO[cuadraticas.escenario as string] ?? CONTEXTO.parabola_basica} · paso {Math.max(1, pasoActual)}/3
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Cuadraticas3DScene a={a} b={b} c={c} target={target} currentRes={currentRes} escenario={cuadraticas.escenario as any} puntosObjetivo={puntos} />
          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-slate-200">
            <Leyenda color="#ff6b9b" texto="Tu parábola" />
            <Leyenda color="#fb8500" texto="Guía y puntos medidos" />
            <Leyenda color="#4cc9f0" texto="Foco y rayos" />
            <Leyenda color="#f25c54" texto="Directriz" />
            {currentRes.delta < 0 && <Leyenda color="#c77dff" texto="Raíces complejas (Argand)" />}
          </div>
        </div>
      }
      panelLateral={
        <div className="space-y-3">
          <EquivFormRow label="Forma vértice" color="rose" formula={forms.vertexForm} />
          {forms.factored && <EquivFormRow label="Forma factorizada" color="amber" formula={forms.factored} />}
          <div className="grid grid-cols-2 gap-2">
            <DataChip label="Vieta · suma (−b/a)" value={Number.isFinite(domainInfo.vietaSum) ? domainInfo.vietaSum.toFixed(2) : '—'} color="cyan" />
            <DataChip label="Vieta · producto (c/a)" value={Number.isFinite(domainInfo.vietaProduct) ? domainInfo.vietaProduct.toFixed(2) : '—'} color="amber" />
          </div>
          <p className="text-[12px] leading-snug text-slate-300">
            Plantea f(−1), f(0) y f(1) con a, b, c desconocidos y resuelve el sistema.
          </p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <GrupoControles>
            <Deslizador etiqueta="Amplitud (a)" valor={a} min={-5} max={5} paso={0.1} decimales={1} ancho="w-44" onChange={(v) => { setCoefsM1(v, b, c); audioEngine?.playPop(); }} />
            <Deslizador etiqueta="Simetría (b)" valor={b} min={-10} max={10} paso={0.5} decimales={1} ancho="w-44" onChange={(v) => { setCoefsM1(a, v, c); audioEngine?.playPop(); }} />
            <Deslizador etiqueta="Intercepto (c)" valor={c} min={-10} max={10} paso={0.5} decimales={1} ancho="w-44" onChange={(v) => { setCoefsM1(a, b, v); audioEngine?.playPop(); }} />
          </GrupoControles>
          <GrupoControles className="items-center">
            <BotonLab variante="secundario" title="Registrar vértice en la bitácora" onClick={() => {
              audioEngine?.playSuccess();
              setAsistente({ text: "Punto de telemetría capturado. Los datos han sido registrados en tu Bitácora Algebraica.", pose: "happy" });
              const nuevoPunto = { id: `p-${Date.now().toString(36)}`, x: vh.toFixed(2), y: vk.toFixed(2), timestamp: "VÉRTICE " + new Date().toLocaleTimeString() };
              const logsPrevios = bitacoraData?.cuadraticas_points || [];
              setBitacora({ ...bitacoraData, cuadraticas_points: [nuevoPunto, ...logsPrevios].slice(0, 10) });
            }}><Activity size={14} /> Registrar V</BotonLab>
            <BotonLab variante="secundario" title="Reiniciar coeficientes" onClick={() => { resetM1(); audioEngine?.playPop(); setAsistente({ text: "Coeficientes reiniciados. La trayectoria objetivo sigue siendo la misma.", pose: "neutral" }); }}>
              <RefreshCcw size={14} /> Reiniciar
            </BotonLab>
            <CalcChip ok={cuadraticas.deltaVerified ?? false} icon={<BookOpen size={11} />} label="Δ" />
            <CalcChip ok={cuadraticas.vertexVerified ?? false} icon={<Pi size={11} />} label="Vértice" />
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              <ShieldCheck size={14} /> {status === 'success' ? 'Sincronizado' : 'Validar'}
            </BotonLab>
          </GrupoControles>
          {(status === 'success' || (status === 'error' && cuadraticas.mensajeFeedback)) && (
            <div role="status" className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-semibold ${status === 'success' ? 'border-emerald-400/50 bg-emerald-600/20 text-emerald-200' : 'border-rose-500/50 bg-rose-950/60 text-rose-200'}`}>
              {status === 'success' && <CheckCircle2 size={14} />}
              {cuadraticas.mensajeFeedback}
            </div>
          )}
        </div>
      }
    />
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />{texto}</span>;
}

function CalcChip({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold ${ok ? 'border-emerald-500/50 bg-emerald-700/40 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'}`} title={ok ? '' : 'Compruébalo en la bitácora'}>
      {icon}{label}{ok ? ' comprobado ✓' : ' · en bitácora'}
    </div>
  );
}

function DataChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = { rose: 'text-rose-400', emerald: 'text-emerald-400', slate: 'text-slate-400', cyan: 'text-cyan-400', amber: 'text-amber-400' };
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-2">
      <span className="mb-0.5 block text-[10px] font-semibold uppercase text-slate-400">{label}</span>
      <span className={`font-mono text-[13px] font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
}

function EquivFormRow({ label, color, formula }: { label: string; color: string; formula: string }) {
  const colors: Record<string, string> = { rose: 'border-rose-500/40 text-rose-300', amber: 'border-amber-500/40 text-amber-300' };
  return (
    <div>
      <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">{label}</span>
      <div className={`border-l-2 pl-3 font-mono text-[12px] font-bold text-white/90 ${colors[color]}`}>{formula}</div>
    </div>
  );
}
