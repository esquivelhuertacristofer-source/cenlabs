"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useSimuladorStore } from "@/store/simuladorStore";
import { validarQ4 } from "@/domain/quimica";
import {
  Zap, ChevronLeft, ChevronRight, BookOpen,
  RefreshCw, Info, Target, AlertCircle,
  FlaskConical, ArrowRight, CheckCircle2, Scale,
} from "lucide-react";

import Limitante3DScene from './simuladores/qmi04/Limitante3DScene';

// Resultados enmascarados: la escena no puede anunciar el limitante ni el exceso
// antes de que el alumno los haya calculado y validado.
const RESULTADOS_OCULTOS = { moles: [0, 0], limitingIdx: -1, theoreticalYield: 0, excessMass: 0 };

const fmt = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—');

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
    const t = setTimeout(() => setSintetizando(false), 2500);
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

  return (
    <div className="relative w-full h-full overflow-hidden font-['Outfit'] bg-[#01080E] text-white">

      {/* ── INFO ACADÉMICA ── */}
      <AnimatePresence>
        {showAcademicInfo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute z-[100] inset-0 flex items-center justify-center p-10 bg-black/80 backdrop-blur-2xl"
            onClick={() => setShowAcademicInfo(false)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl bg-[#023047] border border-cyan-500/30 p-12 rounded-[3.5rem] shadow-2xl relative">
              <button onClick={() => setShowAcademicInfo(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">Cerrar</button>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400"><BookOpen size={32} /></div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Reactivo Limitante</h2>
              </div>
              <div className="space-y-5 text-sm text-cyan-100/70 leading-relaxed">
                <p><strong className="text-white">1. Moles:</strong> n = m / M para cada reactivo.</p>
                <p><strong className="text-white">2. Limitante:</strong> divide los moles de cada reactivo entre su coeficiente en la ecuación. El cociente menor indica el reactivo que se agota primero.</p>
                <p><strong className="text-white">3. Exceso:</strong> con los moles del limitante calcula, por la proporción de coeficientes, cuántos moles del otro reactivo se consumen. Lo que no se consume (en gramos) es el exceso.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D ENGINE ── */}
      <div className="absolute inset-0 z-0">
        <Limitante3DScene
          limitanteData={resuelto ? limitante : { ...limitante, results: RESULTADOS_OCULTOS }}
          isRunning={sintetizando}
        />
      </div>

      {/* ── HEADER ── */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-10 pt-8 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] pointer-events-auto">
          <button aria-label="Reacción anterior" onClick={() => { setReaccionLimitante((reaccionActual + reacciones.length - 1) % reacciones.length); audio?.playClick?.(); }}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all"><ChevronLeft size={18} /></button>
          <div className="px-4 text-center min-w-[200px]">
            <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.5em] block">Síntesis 0{reaccionActual + 1}</span>
            <span className="text-lg font-black tracking-tighter uppercase">{currentReac.nombre}</span>
          </div>
          <button aria-label="Reacción siguiente" onClick={() => { setReaccionLimitante((reaccionActual + 1) % reacciones.length); audio?.playClick?.(); }}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all"><ChevronRight size={18} /></button>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button aria-label="Guía del cálculo" onClick={() => setShowAcademicInfo(true)}
            className="w-12 h-12 rounded-2xl bg-black/50 hover:bg-cyan-500/20 border border-white/10 flex items-center justify-center text-white/60 hover:text-cyan-400 transition-all backdrop-blur-xl">
            <Info size={18} />
          </button>
          <button aria-label="Nueva misión" onClick={() => { generarSemillaP4(); audio?.playClick?.(); }}
            className="h-12 px-4 rounded-2xl bg-black/50 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-white/70 hover:text-white transition-all backdrop-blur-xl text-[10px] font-black uppercase tracking-widest">
            <RefreshCw size={16} /> Nueva misión
          </button>
        </div>
      </header>

      {/* ── DATOS DE LA MISIÓN ── */}
      <aside className="absolute left-10 top-32 z-10 w-[330px] bg-black/55 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Scale size={14} className="text-cyan-400" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">Datos del reactor</span>
        </div>
        <div className="font-mono text-sm text-white bg-white/5 rounded-xl px-3 py-2 border border-white/10">{currentReac.ecuacion}</div>
        {reac.map((r: { formula: string; molar: number; coef: number }, i: number) => (
          <div key={r.formula} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            <div>
              <span className={`text-base font-black ${i === 0 ? 'text-cyan-400' : 'text-yellow-400'}`}>{r.formula}</span>
              <span className="text-[10px] text-white/50 block">M = {r.molar} g/mol · coef. {r.coef}</span>
            </div>
            <span className="text-2xl font-black font-mono">{fmt(inputMasses[i], 1)}<span className="text-xs text-white/50"> g</span></span>
          </div>
        ))}
        <div className="text-[10px] text-white/50 leading-relaxed">
          Productos: {currentReac.productos.map((p: { formula: string; molar: number }) => `${p.formula} (${p.molar} g/mol)`).join(' · ')}
        </div>
      </aside>

      {/* ── RESULTADOS (solo tras validar) ── */}
      {resuelto && !sintetizando && (
        <div className="absolute right-10 top-32 z-10 w-[300px] bg-emerald-950/70 backdrop-blur-2xl border border-emerald-500/30 rounded-[2rem] p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Síntesis completada</span>
          </div>
          <div className="flex justify-between text-sm"><span className="text-white/60">Limitante</span><span className="font-black text-red-300">{reac[results.limitingIdx]?.formula}</span></div>
          <div className="flex justify-between text-sm"><span className="text-white/60">Sobra</span><span className="font-black text-orange-300">{fmt(results.excessMass)} g de {reac[1 - results.limitingIdx]?.formula}</span></div>
          <div className="flex justify-between text-sm"><span className="text-white/60">Rendimiento teórico</span><span className="font-black text-emerald-300">{fmt(results.theoreticalYield)} g {currentReac.productos[0].formula}</span></div>
        </div>
      )}

      {/* ── CONSOLA DE RESPUESTA ── */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center px-10 pb-8">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-8 py-5 flex items-end gap-6 flex-wrap justify-center">
          <div>
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1 mb-2"><Target size={12} className="text-red-400" /> ¿Cuál se agota primero?</span>
            <div className="flex gap-2">
              {reac.map((r: { formula: string }, i: number) => (
                <button key={r.formula} disabled={resuelto}
                  onClick={() => { setElegido(i); audio?.playClick?.(); }}
                  aria-pressed={elegido === i}
                  className={`h-12 px-5 rounded-xl border font-black text-sm transition-all ${elegido === i
                    ? 'bg-red-500/25 border-red-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>
                  {r.formula}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="exceso-q4" className="text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1 mb-2">
              <ArrowRight size={12} className="text-orange-400" /> Masa que sobra {otro !== null ? `de ${reac[otro].formula}` : 'del otro reactivo'}
            </label>
            <div className="flex items-center gap-2">
              <input id="exceso-q4" inputMode="decimal" value={excesoTxt} disabled={resuelto}
                onChange={(e) => setExcesoTxt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && registrar()}
                placeholder="0.00"
                className="w-32 h-12 rounded-xl bg-white/5 border border-white/15 px-4 font-mono text-lg text-white outline-none focus:border-cyan-400/60" />
              <span className="text-sm text-white/60">g</span>
            </div>
          </div>
          <motion.button
            disabled={!puedeRegistrar || resuelto}
            onClick={registrar}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-cyan-500 hover:bg-cyan-400 text-black disabled:bg-white/5 disabled:text-white/30 transition-colors">
            <Zap size={18} /> Registrar y validar
          </motion.button>
          {intentado && !resuelto && status === 'error' && veredicto.mensaje && (
            <div className="basis-full flex items-center gap-2 text-[11px] text-amber-200">
              <AlertCircle size={14} className="text-amber-400 shrink-0" /> {veredicto.mensaje}
            </div>
          )}
          {resuelto && (
            <div className="basis-full flex items-center gap-2 text-[11px] text-emerald-300">
              <FlaskConical size={14} /> Respuesta correcta. Pulsa «Nueva misión» para practicar con otras masas.
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
