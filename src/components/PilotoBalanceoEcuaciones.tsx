"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimuladorStore } from "@/store/simuladorStore";
import { useShallow } from "zustand/react/shallow";
import { esBalanceoMinimo, REACCIONES_REQUERIDAS_Q3 } from "@/domain/quimica";
import { ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, Lock, BookOpen, Info, Minus, Plus } from "lucide-react";
import { audio } from '@/utils/audioEngine';
import LabLayout, { Lectura, BotonLab } from '@/components/simulador/LabLayout';

import Balanceo3DScene from './simuladores/qmi03/Balanceo3DScene';

/** Fórmula con subíndices (sin HTML crudo). */
function Formula({ f }: { f: string }) {
  return <>{f.split(/(\d+)/).map((t, i) => (/^\d+$/.test(t) ? <sub key={i}>{t}</sub> : <React.Fragment key={i}>{t}</React.Fragment>))}</>;
}

function Paso({ formula, valor, color, onMas, onMenos }: { formula: string; valor: number; color: string; onMas: () => void; onMenos: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[12px] font-semibold text-slate-200"><Formula f={formula} /></span>
      <div className="flex items-center rounded-lg border border-white/10 bg-white/5">
        <button onClick={onMenos} aria-label={`Disminuir coeficiente de ${formula}`} className="flex h-8 w-8 items-center justify-center rounded-l-lg text-slate-300 hover:bg-white/10 hover:text-white"><Minus size={14} /></button>
        <span className={`w-9 text-center font-mono text-lg font-bold tabular-nums ${color}`}>{valor}</span>
        <button onClick={onMas} aria-label={`Aumentar coeficiente de ${formula}`} className="flex h-8 w-8 items-center justify-center rounded-r-lg text-slate-300 hover:bg-white/10 hover:text-white"><Plus size={14} /></button>
      </div>
    </div>
  );
}

export default function PilotoBalanceoEcuaciones({ onValidate }: { onValidate?: () => void }) {
  const { balanceo, setReaccion, resetBalanceo, setCoeficiente } = useSimuladorStore(useShallow((s) => ({
    balanceo: s.balanceo, setReaccion: s.setReaccion, resetBalanceo: s.resetBalanceo, setCoeficiente: s.setCoeficiente,
  })));
  const [mounted, setMounted] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const {
    reaccionActual = 0, reacciones = [], coeficientes = [], isBalanced = false,
    atomosReactivos = {}, atomosProductos = {}, masaReactivos = 0, masaProductos = 0,
    reaccionesCompletadas = []
  } = balanceo || {};

  const currentReac = reacciones[reaccionActual] || reacciones[0];
  const isCurrentCompleted = reaccionesCompletadas.includes(currentReac?.id);
  const esUltima = reaccionActual >= reacciones.length - 1;
  const nextUnlocked = isCurrentCompleted && !esUltima;
  const requisitoCumplido = reaccionesCompletadas.length >= REACCIONES_REQUERIDAS_Q3;
  // Balanceada con múltiplos (p. ej. 4,2→4 en vez de 2,1→2): conserva la masa pero no es la ecuación mínima.
  const noMinima = isBalanced && !!currentReac && !esBalanceoMinimo(currentReac, coeficientes);

  const allSymbols = useMemo(() => Array.from(new Set([
    ...Object.keys(atomosReactivos || {}),
    ...Object.keys(atomosProductos || {})
  ])), [atomosReactivos, atomosProductos]);

  const handleCoefChange = (idx: number, delta: number) => {
    const newVal = Math.max(1, (coeficientes[idx] || 1) + delta);
    setCoeficiente(idx, newVal);
    audio?.playClick();
  };

  // Aviso al completar una reacción: se dispara cuando CRECE la lista de completadas
  // (el store solo la amplía con coeficientes mínimos), no con cualquier balance.
  const completadasPrev = useRef(reaccionesCompletadas.length);
  useEffect(() => {
    const prev = completadasPrev.current;
    completadasPrev.current = reaccionesCompletadas.length;
    if (reaccionesCompletadas.length <= prev) return;
    setShowLevelUp(true);
    audio?.playSuccess();
    audio?.playNotification();
    useSimuladorStore.getState().registrarHallazgo('qui_balanceo', {
      reaccion: currentReac?.nombre,
      coeficientes,
      masaReactivos,
      masaProductos,
    });
    const timer = setTimeout(() => setShowLevelUp(false), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaccionesCompletadas.length]);

  if (!mounted || !currentReac) return null;

  const handleLevelChange = (delta: number) => {
    const nextIdx = reaccionActual + delta;
    if (nextIdx < 0 || nextIdx >= reacciones.length) return;
    if (delta > 0 && !nextUnlocked) return;
    setReaccion(nextIdx);
    audio?.playClick();
  };

  const nR = currentReac.reactivos.length;

  const escena = (
    <div className="relative h-full w-full">
      <Balanceo3DScene balanceo={balanceo} />
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-600/95 px-4 py-2 text-white shadow-xl">
              <ShieldCheck size={18} />
              <span className="text-[12px] font-semibold">{esUltima ? 'Última reacción balanceada' : 'Reacción balanceada: la siguiente queda desbloqueada'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAcademicInfo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4"
          >
            <div className="relative max-h-full max-w-xl overflow-y-auto rounded-2xl border border-cyan-500/30 bg-[#0f2538] p-6 shadow-2xl">
              <button onClick={() => setShowAcademicInfo(false)} className="absolute right-4 top-3 text-[12px] text-white/60 hover:text-white">Cerrar</button>
              <BookOpen className="mb-3 text-cyan-400" size={32} />
              <h2 className="mb-3 text-xl font-bold">Guía para el docente</h2>
              <div className="space-y-3 text-[13px] leading-relaxed text-cyan-100/80">
                <p><strong className="text-white">Objetivo:</strong> Demostrar la Ley de Conservación de la Materia mediante el balanceo de ecuaciones estequiométricas.</p>
                <p><strong className="text-white">Mecánica:</strong> El alumno ajusta los coeficientes para igualar el número de átomos en reactivos y productos. En la balanza, cada plato lleva tantas moléculas como indica el coeficiente y el brazo se inclina hacia el lado de mayor masa.</p>
                <p><strong className="text-white">Progreso:</strong> Los niveles están bloqueados para asegurar que el alumno domina reacciones simples antes de pasar a las complejas. Una reacción cuenta solo con los coeficientes enteros mínimos; la práctica se aprueba con {REACCIONES_REQUERIDAS_Q3} reacciones balanceadas.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const barraSuperior = (
    <>
      <button onClick={() => handleLevelChange(-1)} aria-label="Reacción anterior" disabled={reaccionActual === 0}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC] disabled:opacity-30"><ChevronLeft size={16} /></button>
      <div className="flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reacción {reaccionActual + 1} de {reacciones.length}</span>
        <span className="text-[14px] font-bold text-white">{currentReac.nombre}</span>
      </div>
      <button onClick={() => handleLevelChange(1)} aria-label={nextUnlocked ? 'Reacción siguiente' : 'Reacción siguiente (bloqueada: balancea esta primero)'} disabled={!nextUnlocked}
        title={nextUnlocked ? 'Siguiente reacción' : 'Balancea esta reacción para desbloquear la siguiente'}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${nextUnlocked ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-500'}`}>
        {nextUnlocked ? <ChevronRight size={16} /> : <Lock size={14} />}
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button onClick={() => setShowAcademicInfo(true)} title="Objetivos pedagógicos" aria-label="Objetivos pedagógicos" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><Info size={15} /></button>
        <button onClick={resetBalanceo} title="Reiniciar experimento" aria-label="Reiniciar experimento" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RefreshCw size={15} /></button>
      </div>
    </>
  );

  const panelLateral = (
    <div className="flex flex-col gap-3">
      <div>
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Conteo de átomos</span>
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 text-[12px]">
          <span className="text-[10px] font-semibold uppercase text-slate-500">Elem.</span>
          <span className="text-right text-[10px] font-semibold uppercase text-cyan-400">React.</span>
          <span className="text-right text-[10px] font-semibold uppercase text-orange-400">Prod.</span>
          {allSymbols.map((sym) => {
            const a = atomosReactivos[sym] || 0, b = atomosProductos[sym] || 0;
            return (
              <React.Fragment key={sym}>
                <span className="font-mono font-semibold text-white">{sym}</span>
                <span className={`text-right font-mono tabular-nums ${a === b ? 'text-emerald-300' : 'text-cyan-300'}`}>{a}</span>
                <span className={`text-right font-mono tabular-nums ${a === b ? 'text-emerald-300' : 'text-orange-300'}`}>{b}</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] leading-snug text-slate-400">Cada plato de la balanza lleva tantas moléculas como indica el coeficiente. El brazo se inclina hacia el lado más pesado.</p>
    </div>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2">
        {currentReac.reactivos.map((mol: any, idx: number) => (
          <React.Fragment key={`r${idx}`}>
            {idx > 0 && <span className="pb-2 text-lg font-bold text-slate-500">+</span>}
            <Paso formula={mol.formula} valor={coeficientes[idx] || 1} color="text-cyan-300" onMas={() => handleCoefChange(idx, 1)} onMenos={() => handleCoefChange(idx, -1)} />
          </React.Fragment>
        ))}
        <span className="pb-2 text-xl font-bold text-slate-400">→</span>
        {currentReac.productos.map((mol: any, idx: number) => {
          const g = nR + idx;
          return (
            <React.Fragment key={`p${idx}`}>
              {idx > 0 && <span className="pb-2 text-lg font-bold text-slate-500">+</span>}
              <Paso formula={mol.formula} valor={coeficientes[g] || 1} color="text-orange-300" onMas={() => handleCoefChange(g, 1)} onMenos={() => handleCoefChange(g, -1)} />
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <p className={`text-center text-[12px] font-medium ${noMinima ? 'text-amber-300' : 'text-slate-400'}`}>
          {noMinima
            ? 'Balanceada, pero los coeficientes tienen un divisor común: simplifícalos'
            : `Ajusta los coeficientes · ${reaccionesCompletadas.length} de ${REACCIONES_REQUERIDAS_Q3} reacciones balanceadas`}
        </p>
        {requisitoCumplido && onValidate && (
          <BotonLab variante="acento" onClick={onValidate}><ShieldCheck size={14} /> Validar práctica</BotonLab>
        )}
      </div>
    </div>
  );

  // El éxito lo anuncia el flujo común (quiz + modal); aquí sólo el botón de validar.
  const esquina = (
    <div className="flex flex-col gap-1 rounded-lg bg-[#0f1a2b]/85 p-1">
      <Lectura etiqueta="Masa react." valor={masaReactivos.toFixed(1)} unidad="g" />
      <Lectura etiqueta="Masa prod." valor={masaProductos.toFixed(1)} unidad="g" acento={isBalanced} />
    </div>
  );
  return <LabLayout escena={escena} esquina={esquina} barraSuperior={barraSuperior} controles={controles} panelLateral={panelLateral} tituloPanel="Átomos" />;
}
