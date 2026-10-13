"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Trash2, BookOpen, Volume2, Bot,
  Compass, Lightbulb, Droplets, Diamond, Wind, Sparkles
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ANGULO_MIN_M7, ANGULO_MAX_M7 } from '@/domain/matematicas';
import { audio } from '@/utils/audioEngine';
import { useBancoSnell } from '@/components/simuladores/mat07/banco';
import { abbeDe, indiceA, indicesInterfaz, laserDe } from '@/components/simuladores/mat07/optica';

const MATERIALES: { label: string; n: number; icon: React.ReactNode; color: string }[] = [
  { label: 'Aire',      n: 1.000, icon: <Wind size={14} />,      color: 'text-slate-400' },
  { label: 'Agua',      n: 1.333, icon: <Droplets size={14} />,   color: 'text-blue-400' },
  { label: 'Vidrio',    n: 1.500, icon: <Sparkles size={14} />,   color: 'text-cyan-400' },
  { label: 'Cuarzo',    n: 1.544, icon: <Diamond size={14} />,    color: 'text-purple-400' },
  { label: 'Diamante',  n: 2.417, icon: <Diamond size={14} />,    color: 'text-amber-400' },
];

export default function BitacoraSnell({ onValidate }: { onValidate?: () => void }) {
  const { optica7, setOpticaM7, setAnguloM7, resetM7, generarSemillaM7 } = useSimuladorStore(
    useShallow((s) => ({ optica7: s.optica7, setOpticaM7: s.setOpticaM7, setAnguloM7: s.setAnguloM7, resetM7: s.resetM7, generarSemillaM7: s.generarSemillaM7 })),
  );
  const esMisterio = optica7.n2 === 'misterio';
  const { n1, n2, n2Misterio, anguloIncidencia: theta1, status } = optica7;
  const { sentido, laser } = useBancoSnell(useShallow((s) => ({ sentido: s.sentido, laser: s.laser })));

  const [conclusionText, setConclusionText] = useState('');
  const [selectedMat, setSelectedMat] = useState<number | null>(null);

  const handleReset = () => {
    resetM7();
    generarSemillaM7();
    setSelectedMat(null);
    setConclusionText('');
    audio.playPop();
  };

  const handleAngleChange = (val: number) => {
    setAnguloM7(val);
    audio.playPop();
  };

  const handleSelectMaterial = (index: number) => {
    setSelectedMat(index);
    const mat = MATERIALES[index];
    setOpticaM7(n1, mat.n, theta1);
    audio.playPop();
  };

  const handleMisterio = () => {
    setSelectedMat(null);
    setOpticaM7(n1, 'misterio', theta1);
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const n2Val = typeof n2 === 'number' ? n2 : n2Misterio;
  // Mismo banco que la escena: sentido de la luz y fuente (el índice depende de λ, Cauchy).
  const nLaser = indiceA(n2Val, abbeDe(n2Val, esMisterio), laserDe(laser).lambdaNm);
  const [nInc, nTr] = indicesInterfaz(sentido, n1, nLaser);
  const sinTheta2 = (nInc * Math.sin(theta1 * Math.PI / 180)) / nTr;
  const isTIR = sinTheta2 > 1;
  const theta2 = isTIR ? NaN : Math.asin(sinTheta2) * 180 / Math.PI;
  const criticalAngle = nInc <= nTr ? NaN : Math.asin(nTr / nInc) * 180 / Math.PI;
  // Con el cristal misterioso la curva θ₂(θ₁) y su punto darían θ₂ (y n₂) sin medir: se revelan al validar.
  const curvaVisible = !esMisterio || status === 'success';
  // las cifras del misterio (θ₂, n₁/n₂, θc) también se revelan al validar, no antes
  const oculto = !curvaVisible;

  return (
    <div className="space-y-5 animate-in fade-in duration-500 font-['Outfit'] pb-20">

      {/* ═══ CONTROL DE ÁNGULO ═══ */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2rem] border border-cyan-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-cyan-400" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Ángulo de Incidencia</span>
            </div>
            <span className="text-2xl font-black text-white tabular-nums font-mono">{theta1}°</span>
          </div>

          {/* Slider principal */}
          <input
            type="range"
            min={ANGULO_MIN_M7}
            max={ANGULO_MAX_M7}
            step={1}
            value={theta1}
            onChange={e => handleAngleChange(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
              [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(34,211,238,0.6)] [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
          />

          {/* Marcas rápidas */}
          <div className="flex justify-between mt-3">
            {[10, 20, 30, 45, 60, 70, 80].map(a => (
              <button
                key={a}
                onClick={() => handleAngleChange(a)}
                className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${
                  theta1 === a
                    ? 'bg-cyan-400 text-[#023047]'
                    : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                {a}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SELECTOR DE MATERIAL (MEDIO 2) ═══ */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-amber-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Material del Medio 2</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {MATERIALES.map((mat, i) => (
            <button
              key={mat.label}
              onClick={() => handleSelectMaterial(i)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedMat === i
                  ? 'bg-cyan-50 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.18)]'
                  : 'bg-white border-slate-200 hover:border-cyan-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={mat.color}>{mat.icon}</span>
                <span className="text-xs font-black text-[#023047]">{mat.label}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">n = {mat.n.toFixed(3)}</span>
            </button>
          ))}

          {/* Botón Misterio */}
          <button
            onClick={handleMisterio}
            className={`p-3 rounded-xl border text-left transition-all col-span-2 ${
              n2 === 'misterio'
                ? 'bg-amber-50 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.18)]'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400">❓</span>
              <span className="text-xs font-black text-amber-600">Material Desconocido</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">Calcula n₂ con la Ley de Snell</span>
          </button>
        </div>
      </div>

      {/* ═══ TELEMETRÍA EN VIVO ═══ */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-3 shadow-sm">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Telemetría Óptica</span>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#0b1220] rounded-xl">
            <span className="text-[8px] font-black text-cyan-300 uppercase block">θ₁ {sentido === 'aire-bloque' ? 'Incidencia' : 'en el bloque'}</span>
            <span className="text-lg font-black text-white font-mono">{theta1}°</span>
          </div>
          <div className="p-3 bg-[#0b1220] rounded-xl">
            <span className="text-[8px] font-black text-pink-300 uppercase block">θ₂ {sentido === 'aire-bloque' ? 'Refracción' : 'en el aire'}</span>
            <span className="text-lg font-black text-white font-mono">
              {/* Con el medio misterioso θ₂ es la MEDICIÓN del alumno: se lee en el disco graduado, no aquí. */}
              {isTIR ? <span className="text-red-400 text-sm">TIR</span> : oculto ? <span className="text-sm">mídelo</span> : `${theta2.toFixed(1)}°`}
            </span>
          </div>
          <div className="p-3 bg-[#0b1220] rounded-xl">
            <span className="text-[8px] font-black text-slate-400 uppercase block">n₁ / n₂</span>
            {/* Con el medio misterioso, n₁/n₂ ES la respuesta: no se muestra. */}
            <span className="text-sm font-black text-white font-mono">{oculto ? '?' : (n1 / n2Val).toFixed(4)}</span>
          </div>
          <div className="p-3 bg-[#0b1220] rounded-xl">
            <span className="text-[8px] font-black text-slate-400 uppercase block">θ Crítico</span>
            <span className="text-sm font-black text-white font-mono">
              {/* sen θc = n₂/n₁: con el medio misterioso daría n₂ sin medir nada. */}
              {oculto ? '?' : isNaN(criticalAngle) ? 'N/A' : `${criticalAngle.toFixed(1)}°`}
            </span>
          </div>
        </div>

        {isTIR && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <span className="text-[10px] font-black text-red-500 uppercase">⚠ Reflexión Total Interna</span>
            <p className="text-[10px] text-red-500/80 mt-1">
              {oculto ? 'El ángulo supera el crítico.' : `El ángulo supera el crítico (${criticalAngle.toFixed(1)}°).`} La luz no puede salir del bloque.
            </p>
          </motion.div>
        )}
      </div>

      {/* ═══ GRÁFICA θ₁ vs θ₂ EN VIVO ═══ */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-5 shadow-sm">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Curva de Snell — θ₁ vs θ₂</span>
        <div className="bg-[#0b1220] rounded-xl p-3 relative">
          <svg viewBox="0 0 200 120" className="w-full h-auto">
            {/* Grid */}
            {[0, 25, 50, 75, 100].map(x => (
              <line key={`gx${x}`} x1={20 + x * 1.7} y1={10} x2={20 + x * 1.7} y2={110} stroke="#1e293b" strokeWidth={0.5} />
            ))}
            {[0, 30, 60, 90].map(y => (
              <line key={`gy${y}`} x1={20} y1={110 - y * 1.1} x2={190} y2={110 - y * 1.1} stroke="#1e293b" strokeWidth={0.5} />
            ))}

            {/* Axis labels */}
            <text x={100} y={119} textAnchor="middle" fill="#64748b" fontSize={5} fontWeight={900}>θ₁ (°)</text>
            <text x={8} y={60} textAnchor="middle" fill="#64748b" fontSize={5} fontWeight={900} transform="rotate(-90, 8, 60)">θ₂ (°)</text>
            {[0, 30, 60, 90].map(v => (
              <text key={`lx${v}`} x={20 + v * 1.88} y={118} textAnchor="middle" fill="#475569" fontSize={4}>{v}</text>
            ))}
            {[0, 30, 60, 90].map(v => (
              <text key={`ly${v}`} x={17} y={112 - v * 1.1} textAnchor="end" fill="#475569" fontSize={4}>{v}</text>
            ))}

            {/* TIR zone (if applicable) */}
            {curvaVisible && !isNaN(criticalAngle) && (
              <>
                <rect x={20 + criticalAngle * 1.88} y={10} width={190 - (20 + criticalAngle * 1.88)} height={100} fill="#ef4444" opacity={0.06} />
                <line x1={20 + criticalAngle * 1.88} y1={10} x2={20 + criticalAngle * 1.88} y2={110} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3,2" />
                <text x={20 + criticalAngle * 1.88 + 2} y={18} fill="#ef4444" fontSize={4} fontWeight={900}>θc={criticalAngle.toFixed(0)}°</text>
              </>
            )}

            {/* Snell curve */}
            {curvaVisible && <path
              d={Array.from({ length: 89 }, (_, i) => {
                const a = i + 1;
                const s = (nInc * Math.sin(a * Math.PI / 180)) / nTr;
                if (s > 1) return '';
                const t2 = Math.asin(s) * 180 / Math.PI;
                const x = 20 + a * 1.88;
                const y = 110 - t2 * 1.1;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={1.5}
              strokeLinecap="round"
            />}

            {/* Current position dot */}
            {curvaVisible && !isTIR && (
              <circle
                cx={20 + theta1 * 1.88}
                cy={110 - theta2 * 1.1}
                r={3}
                fill="#22d3ee"
                stroke="white"
                strokeWidth={1}
              >
                <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite" />
              </circle>
            )}

            {/* 45° reference line */}
            <line x1={20} y1={110} x2={20 + 90 * 1.88} y2={110 - 90 * 1.1} stroke="#334155" strokeWidth={0.5} strokeDasharray="2,3" />
          </svg>
          {!curvaVisible && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Se revela al validar</span>
          )}
        </div>
      </div>

      {/* ═══ CONCLUSIÓN ESCRITA ═══ */}
      <div className="p-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[#023047]" />
            <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Conclusión</span>
          </div>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {wordCount}/30
          </span>
        </div>
        <textarea
          value={conclusionText} onChange={e => setConclusionText(e.target.value)}
          placeholder="¿Qué sucede con el ángulo refractado cuando aumentas θ₁? ¿Cómo influye el índice n₂ en la desviación?"
          rows={3}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
        />
      </div>

      {/* ═══ ACCIONES ═══ */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="w-12 h-12 bg-slate-100 hover:bg-cyan-50 text-slate-400 hover:text-cyan-500 rounded-xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={onValidate}
          className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg ${
            wordCount >= 30 ? 'bg-[#023047] text-white hover:bg-[#034067]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          disabled={wordCount < 30}
        >
          <ShieldCheck size={14} />
          Certificar Misión
        </button>
      </div>
    </div>
  );
}
