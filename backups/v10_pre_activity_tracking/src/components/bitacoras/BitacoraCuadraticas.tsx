"use client";

import React, { useEffect, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  Target, Activity, Zap, CheckCircle2, Star, Table, Info,
  Trash2, ShieldCheck, ChevronDown, ChevronUp, Calculator, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDomainRangeInfo, getCompleteSquareSteps } from '@/utils/mathEngine';

export default function BitacoraCuadraticas() {
  const { cuadraticas, validarM1, generarSemillaM1, resetM1, setDeltaVerified, setVertexVerified } = useSimuladorStore();
  const { a, b, c, target, status, mensajeFeedback } = cuadraticas;
  // Fallback seguro para campos que podrían llegar undefined durante hidratación de Zustand
  const estrellas  = cuadraticas.estrellas  ?? 0;
  const hallazgos  = cuadraticas.hallazgos  ?? [];

  // ── Estado Local ──────────────────────────────────────────────────────────
  const [showSteps,      setShowSteps]      = useState(false);
  const [deltaInput,     setDeltaInput]     = useState('');
  const [deltaFeedback,  setDeltaFeedback]  = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [vertexInput,    setVertexInput]    = useState('');
  const [vertexFeedback, setVertexFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [conclusionText, setConclusionText] = useState('');

  // Generar semilla si se está usando la ec. por defecto
  useEffect(() => {
    if (target.a === 2 && target.b === -2 && target.c === -3) {
      generarSemillaM1();
    }
  }, []);

  // ── Matemáticas en Tiempo Real ────────────────────────────────────────────
  const safeA  = a || 0.001;
  const delta  = b * b - 4 * a * c;
  const vx     = -b / (2 * safeA);
  const vy     = a * vx * vx + b * vx + c;
  const x1     = delta >= 0 ? (-b + Math.sqrt(delta)) / (2 * a) : null;
  const x2     = delta >= 0 ? (-b - Math.sqrt(delta)) / (2 * a) : null;

  const domainInfo = getDomainRangeInfo(a, b, vy, c);
  const steps      = getCompleteSquareSteps(a, b, c);

  // ── Verificación de Cálculos del Alumno ──────────────────────────────────
  const checkDelta = () => {
    const val = parseFloat(deltaInput);
    const ok = !isNaN(val) && Math.abs(val - delta) < 0.15;
    setDeltaFeedback(ok ? 'correct' : 'wrong');
    setDeltaVerified(ok);
  };

  const checkVertex = () => {
    const val = parseFloat(vertexInput);
    const ok = !isNaN(val) && Math.abs(val - vx) < 0.15;
    setVertexFeedback(ok ? 'correct' : 'wrong');
    setVertexVerified(ok);
  };

  const handleReset = () => {
    resetM1();
    generarSemillaM1();
    setDeltaInput(''); setDeltaFeedback('idle');
    setVertexInput(''); setVertexFeedback('idle');
    setConclusionText('');
    setShowSteps(false);
  };

  // ── Gate de Validación ──────────────────────────────────────────────────────
  // El alumno debe calcular correctamente Δ y h Y escribir una conclusión de 30+ palabras
  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = (cuadraticas.deltaVerified ?? false) && 
                      (cuadraticas.vertexVerified ?? false) && 
                      (wordCount >= 30);

  // ── Checklists Progress ───────────────────────────────────────────────────
  const checkItems = [
    { label: "Concavidad correcta (signo de 'a')",    done: Math.sign(a) === Math.sign(target.a) },
    { label: 'Vértice X sincronizado (h ≈ h_target)', done: Math.abs(vx - (-target.b / (2 * target.a))) < 0.5 },
    { label: 'Intercepto Y ajustado (c ≈ c_target)',  done: Math.abs(c - target.c) < 0.5 },
    { label: 'Discriminante calculado manualmente',    done: deltaFeedback === 'correct' },
    { label: 'Abscisa del vértice calculada',         done: vertexFeedback === 'correct' },
    { label: 'Trayectoria validada en el piloto',     done: status === 'success' },
  ];
  const completedCount = checkItems.filter(i => i.done).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-16">

      {/* ── HEADER CON ESTRELLAS ── */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Registro Algebraico</h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MAT-01 · Ecuaciones Cuadráticas</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <Star key={s} size={18} className={s <= estrellas ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
      </div>

      {/* ── TARJETA DE MISIÓN ── */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <Target size={56} />
        </div>
        <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase tracking-[0.3em] text-rose-400">
          <Target size={12} /> Objetivo de Sincronía
        </div>
        <p className="text-[10px] font-bold text-slate-500 mb-5 leading-relaxed">
          Ajusta <span className="text-white">a, b, c</span> en el piloto para interceptar la trayectoria guía.
        </p>
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 font-mono text-center shadow-inner">
          <span className="text-xl font-black text-white/90 tracking-tighter italic">
            f(x) = {target.a.toFixed(1)}x²
            {' '}{target.b >= 0 ? '+' : '−'} {Math.abs(target.b).toFixed(1)}x
            {' '}{target.c >= 0 ? '+' : '−'} {Math.abs(target.c).toFixed(1)}
          </span>
        </div>
      </div>

      {/* ── FEEDBACK PEDAGÓGICO ── */}
      <AnimatePresence mode="wait">
        {mensajeFeedback && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`p-4 rounded-2xl border flex items-start gap-3 overflow-hidden
              ${status === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
          >
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest block mb-0.5">
                {status === 'success' ? 'Éxito del Sistema' : 'Análisis del Sistema'}
              </span>
              <span className="text-[11px] font-bold leading-tight">{mensajeFeedback}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PROPIEDADES FORMALES (DOMINIO, RANGO, VIETA) ── */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
          <BookOpen size={12} className="text-purple-500" /> Propiedades Formales
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <PropChip label="Dom(f)" value={domainInfo.domain} />
          <PropChip
            label="Ran(f)"
            value={domainInfo.range}
            valueClass={a > 0 ? 'text-emerald-600' : 'text-rose-600'}
          />
          <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Concavidad & Extremo Global</span>
            <span className="text-[10px] font-bold text-slate-600">{domainInfo.concavity}</span>
          </div>
          <PropChip
            label="Suma de Raíces (Vieta):  r₁+r₂ = −b/a"
            value={isNaN(domainInfo.vietaSum) ? 'N/A (a=0)' : domainInfo.vietaSum.toFixed(2)}
          />
          <PropChip
            label="Producto de Raíces (Vieta):  r₁·r₂ = c/a"
            value={isNaN(domainInfo.vietaProduct) ? 'N/A (a=0)' : domainInfo.vietaProduct.toFixed(2)}
          />
        </div>
      </div>

      {/* ── CÁLCULO PROPIO DEL ALUMNO ── */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <Calculator size={12} className="text-[#FB8500]" /> Cálculo Propio
        </h4>

        {/* Discriminante */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
          <div>
            <p className="text-[9px] font-black text-amber-800 mb-0.5 uppercase tracking-wider">Calcula el Discriminante:</p>
            <p className="text-[10px] font-bold text-amber-700 font-mono">
              Δ = b² − 4ac = ({b.toFixed(1)})² − 4({a.toFixed(1)})({c.toFixed(1)}) = ?
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="number" value={deltaInput} placeholder="Tu resultado..."
              onChange={e => { setDeltaInput(e.target.value); setDeltaFeedback('idle'); }}
              className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-white font-mono text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <button onClick={checkDelta}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 transition-colors">
              Verificar
            </button>
          </div>
          <AnimatePresence>
            {deltaFeedback !== 'idle' && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`text-[10px] font-black px-3 py-2 rounded-lg ${deltaFeedback === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {deltaFeedback === 'correct'
                  ? `✅ ¡Correcto!  Δ = ${delta.toFixed(2)}`
                  : `❌ Revisa: b² = ${(b * b).toFixed(1)},  4ac = ${(4 * a * c).toFixed(1)},  Δ = ${delta.toFixed(2)}`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vértice (abscisa) */}
        <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100 space-y-3">
          <div>
            <p className="text-[9px] font-black text-cyan-800 mb-0.5 uppercase tracking-wider">Calcula la Abscisa del Vértice (h):</p>
            <p className="text-[10px] font-bold text-cyan-700 font-mono">
              h = −b / 2a = −({b.toFixed(1)}) / 2({a.toFixed(1)}) = ?
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="number" value={vertexInput} placeholder="Tu resultado..."
              onChange={e => { setVertexInput(e.target.value); setVertexFeedback('idle'); }}
              className="flex-1 px-3 py-2 rounded-xl border border-cyan-200 bg-white font-mono text-sm font-bold text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
            <button onClick={checkVertex}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-cyan-600 transition-colors">
              Verificar
            </button>
          </div>
          <AnimatePresence>
            {vertexFeedback !== 'idle' && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`text-[10px] font-black px-3 py-2 rounded-lg ${vertexFeedback === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {vertexFeedback === 'correct'
                  ? `✅ ¡Correcto!  h = ${vx.toFixed(2)}`
                  : `❌ Recuerda: h = −b/2a = ${(-b).toFixed(1)} / ${(2 * a).toFixed(1)} = ${vx.toFixed(2)}`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── CHECKLIST DE ANÁLISIS ── */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-[#FB8500]" /> Checklist de Análisis
          </h4>
          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
            {completedCount}/{checkItems.length}
          </span>
        </div>
        <div className="space-y-2">
          {checkItems.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-center p-2.5 bg-slate-50/60 rounded-xl border border-slate-100 transition-all">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-all
                ${item.done ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200'}`}>
                {item.done && <CheckCircle2 size={11} />}
              </div>
              <span className={`text-[11px] font-bold ${item.done ? 'text-slate-800' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMPLETAR EL CUADRADO (Expandible) ── */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Zap size={13} className="text-purple-500" />
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
              Completar el Cuadrado — Derivación Paso a Paso
            </span>
          </div>
          {showSteps
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </button>

        <AnimatePresence>
          {showSteps && (
            <motion.div
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-2 border-t border-slate-50">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-start gap-3 py-2 ${i === steps.length - 1 ? 'bg-purple-50 rounded-xl px-3 border border-purple-100' : ''}`}
                  >
                    <span className="text-[9px] font-black text-slate-300 mt-1.5 w-4 shrink-0">{i + 1}</span>
                    <div className="flex flex-col gap-0.5">
                      <code className="text-[11px] font-black text-slate-800 font-mono">{step.expression}</code>
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${i === steps.length - 1 ? 'text-purple-600' : 'text-slate-400'}`}>
                        {step.annotation}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LOG DE HALLAZGOS ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Table size={14} className="text-cyan-500" />
            <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Log de Hallazgos</h4>
          </div>
          <span className="text-[8px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
            {hallazgos.length} / 10
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-medium text-slate-600">
            <thead className="bg-white text-[8px] font-black text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">Ecuación</th>
                <th className="px-2 py-3 text-center">Δ</th>
                <th className="px-2 py-3">Vértice</th>
                <th className="px-4 py-3 text-right">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hallazgos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <Zap size={22} />
                      <span className="text-[10px] font-bold italic">
                        Usa 'Data Log' en el piloto para registrar ecuaciones.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                hallazgos.map((h) => (
                  <motion.tr
                    key={h.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-black text-slate-800 font-mono text-[10px]">{h.eq}</td>
                    <td className="px-2 py-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] ${h.delta < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {h.delta.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-2 py-3 font-bold text-slate-400 text-[9px] font-mono">
                      ({h.h.toFixed(1)}, {h.k.toFixed(1)})
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 font-bold text-[9px]">{h.timestamp}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CONCLUSIÓN DEL ALUMNO ── */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <BookOpen size={12} className="text-indigo-500" /> Conclusión del Alumno
          </h4>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
            conclusionText.trim().split(/\s+/).filter(Boolean).length >= 30
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}>
            {conclusionText.trim().split(/\s+/).filter(Boolean).length} / 30 palabras mín.
          </span>
        </div>

        {/* Pregunta guiada 1 */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">
            ¿Qué relación observaste entre el discriminante y la gráfica de la parábola?
          </p>
          <p className="text-[9px] text-slate-400 font-bold">
            (Pista: ¿Cuántos puntos tocó el eje X según el valor de Δ?)
          </p>
        </div>

        <textarea
          value={conclusionText}
          onChange={e => setConclusionText(e.target.value)}
          placeholder="Escribe tu conclusión aquí. Describe qué aprendiste sobre las ecuaciones cuadráticas, cómo afectan los coeficientes a, b y c a la forma de la parábola, y en qué situación real podrías aplicar este conocimiento..."
          rows={5}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed placeholder:text-slate-300 placeholder:font-normal"
        />

        {/* Pregunta guiada 2 */}
        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-[9px] font-black text-indigo-700 uppercase tracking-wider mb-1">
            Aplicación en el mundo real
          </p>
          <p className="text-[9px] text-indigo-600 font-bold">
            Menciona UN ejemplo concreto donde una ecuación cuadrática describa un fenómeno real (físico, ingenieril o económico).
          </p>
        </div>

        {conclusionText.trim().split(/\s+/).filter(Boolean).length < 30 && (
          <p className="text-[9px] text-amber-600 font-bold flex items-center gap-1.5">
            <span>⚠️</span>
            La conclusión mínima es de 30 palabras para poder someter la validación.
          </p>
        )}
      </div>

      {/* ── ACCIONES FINALES ── */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shrink-0"
        >
          <Trash2 size={18} />
        </button>

        {/* Botón con gate de validación */}
        <div className="flex-1 flex flex-col gap-2">
          {!canValidate && status !== 'success' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-base">🔒</span>
              <p className="text-[9px] font-bold text-amber-700 leading-snug">
                Verifica correctamente el Discriminante y el Vértice en Cualculo Propio antes de validar.
              </p>
            </div>
          )}
          <button
            onClick={canValidate ? validarM1 : undefined}
            disabled={!canValidate && status !== 'success'}
            className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl
              ${
                status === 'success'
                  ? 'bg-emerald-500 text-white shadow-emerald-200 cursor-default'
                  : canValidate
                  ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
          >
            <ShieldCheck size={18} />
            {status === 'success' ? 'Ecuación Sincronizada ✓' : 'Someter para Validación'}
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Sub-Componentes ──────────────────────────────────────────────────────────
function PropChip({
  label, value, valueClass,
}: {
  label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
      <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">{label}</span>
      <span className={`text-[11px] font-black font-mono ${valueClass ?? 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
