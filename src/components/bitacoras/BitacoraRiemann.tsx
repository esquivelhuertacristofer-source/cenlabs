"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, Calculator, BookOpen, Bot, Volume2, Sigma, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  sumaRiemannM9, errorRelativoM9, TOLERANCIA_M9, NOMBRE_METODO_M9, INTEGRAL_EXACTA_M9, N_MAX_M9, A_M9, B_M9,
} from '@/domain/matematicas';
import { audio } from '@/utils/audioEngine';

/** Coma decimal y signo menos tipográfico, como el dock y la barra del lab (−0 se escribe 0). */
const decimal = (v: number, d: number) => {
  const t = (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
  return t.replace('-', '−').replace('.', ',');
};

/**
 * Bitácora del MAT-09. NO REGALA: antes de validar no muestra la integral exacta, ni el error, ni
 * si la tolerancia ya se cumple (eso es justo lo que el alumno tiene que averiguar con Barrow).
 */
export default function BitacoraRiemann({ onValidate }: { onValidate?: () => void }) {
  const { integral9, setIntegralM9, resetM9 } = useSimuladorStore(
    useShallow((s) => ({ integral9: s.integral9, setIntegralM9: s.setIntegralM9, resetM9: s.resetM9 })),
  );
  const { n, metodo, metodoReto, status } = integral9;
  const tol = TOLERANCIA_M9[metodoReto];

  const [conclusionText, setConclusionText] = useState('');

  const handleReset = () => {
    resetM9();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = wordCount >= 30;

  // Los MISMOS números que usa el validador; el error sólo se enseña tras validar.
  const suma = sumaRiemannM9(n, metodo);
  const errRel = errorRelativoM9(n, metodo);
  const validado = status === 'success';
  const checkMetodo = metodo === metodoReto;
  const checkDensity = n > 10;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">

      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-amber-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
             <span className="text-[10px] font-black text-amber-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>

          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo de Integración</h4>
          <p className="text-[11px] text-slate-300 font-medium mb-6 leading-relaxed">
            Reto: aproxima ∫₀¹⁰ (0,1x² + 1) dx con {NOMBRE_METODO_M9[metodoReto]} y un error relativo menor a {decimal(tol * 100, 1)} %. Calcula tú la integral exacta con la regla de Barrow para comparar.
          </p>

          <button
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Telemetría
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-amber-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      {/* (fondo claro: el panel lateral es blanco; con bg-white/5 y texto blanco no se leía nada) */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Sigma size={14} className="text-amber-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Densidad */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkDensity ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkDensity ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Densidad de Muestreo (n)
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                     {checkDensity ? `✓ ${n} rectángulos de Δx = ${decimal((B_M9 - A_M9) / n, 3)}` : `... ${n} rectángulos: aumenta la partición`}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkDensity ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
            </div>

            {/* Hallazgo: Método */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkMetodo ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkMetodo ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Método del reto
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                     {checkMetodo ? `✓ Usando ${NOMBRE_METODO_M9[metodo]}` : `... Ahora: ${NOMBRE_METODO_M9[metodo]}`}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkMetodo ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            </div>

            {/* Hallazgo: Precisión (sólo se juzga al validar) */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${validado ? 'bg-emerald-50 border-emerald-300' : status === 'error' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${validado ? 'text-emerald-600' : status === 'error' ? 'text-rose-600' : 'text-slate-500'}`}>
                     Precisión del reto (error &lt; {decimal(tol * 100, 1)} %)
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                     {validado ? `✓ Error ${decimal(errRel * 100, 3)} %: dentro de la tolerancia`
                       : status === 'error' ? '✗ Aún no cumple: revisa tu integral exacta y refina n'
                       : '... Se comprueba al validar'}
                  </span>
               </div>
                <div className={`w-2 h-2 rounded-full ${validado ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : status === 'error' ? 'bg-rose-400' : 'bg-slate-400'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE ÁREA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitor de Convergencia</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">La suma frente a la integral</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Σ Riemann (n = {n})</span>
              <span className="text-sm font-black text-[#023047] font-mono">{decimal(suma, 4)}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {validado ? (
                <>
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Error | Σ − ∫ | (∫ = 130/3)</span>
                  <span className="text-sm font-black font-mono text-amber-600">{decimal(Math.abs(suma - INTEGRAL_EXACTA_M9), 4)}</span>
                </>
              ) : (
                <>
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Integral exacta ∫</span>
                  <span className="text-[11px] font-bold text-slate-600">Calcúlala con Barrow</span>
                </>
              )}
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Límite</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{wordCount}/30</span>
          </div>
          <textarea
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué sucede con el error de aproximación cuando el número de rectángulos (n) aumenta significativamente..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          aria-label="Reiniciar el reto"
          className="w-14 h-14 bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={() => { setIntegralM9(Math.min(N_MAX_M9, n + 10), metodo); audio.playPop(); }}
          aria-label="Diez rectángulos más"
          className="w-14 h-14 bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={() => onValidate?.()}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {status === 'success' ? 'Integral validada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
