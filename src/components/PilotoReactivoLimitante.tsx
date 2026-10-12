"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useSimuladorStore } from "@/store/simuladorStore";
import { validarQ4 } from "@/domain/quimica";
import {
  Zap, ChevronLeft, ChevronRight, BookOpen,
  RefreshCw, Info, Target, AlertCircle, FlaskConical, CheckCircle2,
} from "lucide-react";
import LabLayout, { BotonLab } from '@/components/simulador/LabLayout';

import Limitante3DScene from './simuladores/qmi04/Limitante3DScene';

// Resultados enmascarados: la escena no puede anunciar el limitante ni el exceso
// antes de que el alumno los haya calculado y validado.
const RESULTADOS_OCULTOS = { moles: [0, 0], limitingIdx: -1, theoreticalYield: 0, excessMass: 0 };

const fmt = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—');

/** Fórmula con subíndices (sin HTML crudo). */
function Formula({ f }: { f: string }) {
  return <>{f.split(/(\d+)/).map((t, i) => (/^\d+$/.test(t) ? <sub key={i}>{t}</sub> : <React.Fragment key={i}>{t}</React.Fragment>))}</>;
}

export default function PilotoReactivoLimitante({ onValidate }: { onValidate?: () => void }) {
  const { limitante, setReaccionLimitante, generarSemillaP4, setRespuestaP4, validarP4, audio } =
    useSimuladorStore(useShallow((s) => ({
      limitante: s.limitante, setReaccionLimitante: s.setReaccionLimitante,
      generarSemillaP4: s.generarSemillaP4, setRespuestaP4: s.setRespuestaP4,
      validarP4: s.validarP4, audio: s.audio,
    })));
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);
  const [elegido, setElegido] = useState<number | null>(null);
  const [excesoTxt, setExcesoTxt] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [sintetizando, setSintetizando] = useState(false);

  const {
    reaccionActual = 0, reacciones = [], inputMasses = [0, 0],
    results = RESULTADOS_OCULTOS, status = 'idle',
  } = limitante;
  const currentReac = reacciones[reaccionActual] || reacciones[0];
  const resuelto = status === 'success';

  // Nueva misión o nueva reacción → la consola se limpia.
  const claveMision = `${reaccionActual}:${inputMasses.join(',')}`;
  useEffect(() => { setElegido(null); setExcesoTxt(''); setIntentado(false); }, [claveMision]);

  // Al validar con éxito corre la síntesis: el reactivo limitante se agota y sobra el otro.
  useEffect(() => {
    if (!resuelto) return;
    setSintetizando(true);
    audio?.playNotification?.();
    const t = setTimeout(() => setSintetizando(false), 2800);
    return () => clearTimeout(t);
  }, [resuelto, audio]);

  // Retroalimentación del panel = la misma función de dominio que juzga la práctica.
  const veredicto = useMemo(() => validarQ4(limitante), [limitante]);

  const exceso = parseFloat(excesoTxt.replace(',', '.'));
  const puedeRegistrar = elegido !== null && Number.isFinite(exceso) && exceso >= 0;

  const registrar = () => {
    if (!puedeRegistrar) return;
    setRespuestaP4(elegido, exceso);
    setIntentado(true);
    audio?.playClick?.();
    if (onValidate) onValidate();
    else validarP4();
  };

  if (!currentReac) return null;
  const reac = currentReac.reactivos;
  const otro = elegido === null ? null : 1 - elegido;

  const escena = (
    <div className="relative h-full w-full">
      <Limitante3DScene
        limitanteData={resuelto ? limitante : { ...limitante, results: RESULTADOS_OCULTOS }}
        isRunning={sintetizando}
      />
      <AnimatePresence>
        {showAcademicInfo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4"
            onClick={() => setShowAcademicInfo(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="relative max-h-full max-w-xl overflow-y-auto rounded-2xl border border-cyan-500/30 bg-[#0f2538] p-6 shadow-2xl">
              <button onClick={() => setShowAcademicInfo(false)} className="absolute right-4 top-3 text-[12px] text-white/60 hover:text-white">Cerrar</button>
              <div className="mb-3 flex items-center gap-3">
                <BookOpen className="text-cyan-400" size={28} />
                <h2 className="text-xl font-bold">Reactivo limitante</h2>
              </div>
              <div className="space-y-3 text-[13px] leading-relaxed text-cyan-100/80">
                <p><strong className="text-white">1. Moles:</strong> n = m / M para cada reactivo.</p>
                <p><strong className="text-white">2. Limitante:</strong> divide los moles de cada reactivo entre su coeficiente en la ecuación. El cociente menor indica el reactivo que se agota primero.</p>
                <p><strong className="text-white">3. Exceso:</strong> con los moles del limitante calcula, por la proporción de coeficientes, cuántos moles del otro reactivo se consumen. Lo que no se consume (en gramos) es el exceso.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const barraSuperior = (
    <>
      <button aria-label="Reacción anterior" onClick={() => { setReaccionLimitante((reaccionActual + reacciones.length - 1) % reacciones.length); audio?.playClick?.(); }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><ChevronLeft size={16} /></button>
      <div className="flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Síntesis {reaccionActual + 1} de {reacciones.length}</span>
        <span className="text-[14px] font-bold text-white">{currentReac.nombre}</span>
      </div>
      <button aria-label="Reacción siguiente" onClick={() => { setReaccionLimitante((reaccionActual + 1) % reacciones.length); audio?.playClick?.(); }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><ChevronRight size={16} /></button>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button aria-label="Guía del cálculo" title="Guía del cálculo" onClick={() => setShowAcademicInfo(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><Info size={15} /></button>
        <button aria-label="Nueva misión" title="Nueva misión (otras masas)" onClick={() => { generarSemillaP4(); audio?.playClick?.(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RefreshCw size={15} /></button>
      </div>
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-stretch gap-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[12px] text-white">{currentReac.ecuacion}</div>
        {reac.map((r: { formula: string; molar: number; coef: number }, i: number) => (
          <div key={r.formula} className={`rounded-lg border px-2.5 py-1 text-[11px] leading-tight ${i === 0 ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-yellow-500/40 bg-yellow-500/10'}`}>
            <span className={`text-[13px] font-bold ${i === 0 ? 'text-cyan-300' : 'text-yellow-300'}`}><Formula f={r.formula} /></span>
            <span className="text-slate-300"> · m = <b className="font-mono text-white">{fmt(inputMasses[i], 1)} g</b></span>
            <span className="block text-slate-400">M = {r.molar} g/mol · coef. {r.coef}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div>
          <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Target size={12} className="text-red-400" /> ¿Cuál se agota primero?</span>
          <div className="flex gap-1.5">
            {reac.map((r: { formula: string }, i: number) => (
              <button key={r.formula} disabled={resuelto}
                onClick={() => { setElegido(i); audio?.playClick?.(); }}
                aria-pressed={elegido === i}
                className={`h-9 rounded-lg border px-4 text-[13px] font-bold transition-colors ${elegido === i
                  ? 'border-red-400/60 bg-red-500/25 text-white'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'} disabled:opacity-60`}>
                <Formula f={r.formula} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="exceso-q4" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Masa que sobra {otro !== null ? <>de <Formula f={reac[otro].formula} /></> : 'del otro reactivo'}
          </label>
          <div className="flex items-center gap-1.5">
            <input id="exceso-q4" inputMode="decimal" value={excesoTxt} disabled={resuelto}
              onChange={(e) => setExcesoTxt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && registrar()}
              placeholder="0.00"
              className="h-9 w-28 rounded-lg border border-white/15 bg-white/5 px-3 font-mono text-[14px] text-white outline-none focus:border-cyan-400/60" />
            <span className="text-[13px] text-slate-400">g</span>
          </div>
        </div>
        <BotonLab onClick={registrar} deshabilitado={!puedeRegistrar || resuelto}><Zap size={14} /> Registrar y validar</BotonLab>
      </div>

      {intentado && !resuelto && status === 'error' && veredicto.mensaje && (
        <div className="flex items-center gap-2 text-[12px] text-amber-200">
          <AlertCircle size={14} className="shrink-0 text-amber-400" /> {veredicto.mensaje}
        </div>
      )}
      {resuelto && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
          <div className="mb-0.5 flex items-center gap-1.5 font-semibold text-emerald-300"><CheckCircle2 size={14} /> Síntesis completada</div>
          Limitante: <b className="text-white"><Formula f={reac[results.limitingIdx]?.formula ?? ''} /></b>
          {' · '}sobra <b className="text-white">{fmt(results.excessMass)} g</b> de <Formula f={reac[1 - results.limitingIdx]?.formula ?? ''} />
          {' · '}rendimiento teórico <b className="text-white">{fmt(results.theoreticalYield)} g</b> <Formula f={currentReac.productos[0].formula} />
          <span className="mt-0.5 flex items-center gap-1 text-emerald-300/80"><FlaskConical size={12} /> Pulsa «Nueva misión» para practicar con otras masas.</span>
        </div>
      )}
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}
