"use client";

/**
 * DrQuantumTutor.tsx
 * Tutorial interactivo tipo "fichas" para el Dr. Quantum.
 * El asistente guía al alumno paso a paso con mensajes conversacionales,
 * indicadores de progreso y acciones contextuales.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CheckCircle2,
  Lightbulb, Zap, RotateCcw, Play, Square, Volume2,
} from "lucide-react";
import Image from "next/image";
import { audio } from "@/utils/audioEngine";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type TutorStep = {
  id: number;
  /** Texto principal del Dr. Quantum — usa tono conversacional */
  mensaje: string;
  /** Pista corta mostrada en la barra de progreso */
  pista: string;
  /** Ícono temático para el paso */
  tipo: "intro" | "calculo" | "accion" | "verificar" | "logro";
  /** Texto del botón de acción contextual (opcional) */
  accion?: string;
};

interface DrQuantumTutorProps {
  steps: TutorStep[];
  /** Paso del simulador que se completó (controlado externamente) */
  pasoCompletado?: number;
  /** Callback cuando el alumno pulsa el botón de acción de un paso */
  onAccion?: (stepId: number) => void;
  /** Nombre del alumno (para personalizar mensajes) */
  nombreAlumno?: string;
  /** Texto de misión para el botón de audio */
  mision?: string;
}

// ─── Ícono según tipo ─────────────────────────────────────────────────────────
const TipoIcon = ({ tipo }: { tipo: TutorStep["tipo"] }) => {
  const map = {
    intro:     <Lightbulb size={13} className="text-amber-400" />,
    calculo:   <Zap size={13} className="text-cyan-400" />,
    accion:    <Zap size={13} className="text-rose-400" />,
    verificar: <CheckCircle2 size={13} className="text-emerald-400" />,
    logro:     <CheckCircle2 size={13} className="text-amber-400" />,
  };
  return map[tipo] ?? null;
};

// ─── Color de acento por tipo ─────────────────────────────────────────────────
const accentColor: Record<TutorStep["tipo"], string> = {
  intro:     "#FB8500",
  calculo:   "#22d3ee",
  accion:    "#f43f5e",
  verificar: "#10b981",
  logro:     "#fbbf24",
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function DrQuantumTutor({
  steps,
  pasoCompletado = 0,
  onAccion,
  nombreAlumno = "Estudiante",
  mision = "",
}: DrQuantumTutorProps) {
  const [current, setCurrent]   = useState(0);
  const [imgError, setImgError] = useState(false);
  const [typed, setTyped]       = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [playing, setPlaying]   = useState(false);

  const step   = steps[current];
  const isFirst = current === 0;
  const isLast  = current === steps.length - 1;
  const done    = pasoCompletado >= step.id;
  const accent  = accentColor[step.tipo];

  // ── Efecto typewriter ────────────────────────────────────────────────────────
  useEffect(() => {
    setTyped("");
    setIsTyping(true);
    let i = 0;
    const texto = step.mensaje.replace("{alumno}", nombreAlumno);
    const timer = setInterval(() => {
      if (i < texto.length) {
        setTyped(texto.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [current, step.mensaje, nombreAlumno]);

  // ── Auto-avanzar cuando el paso se completa externamente ─────────────────────
  useEffect(() => {
    if (pasoCompletado > 0 && pasoCompletado === step.id && !isLast) {
      const t = setTimeout(() => setCurrent(c => Math.min(c + 1, steps.length - 1)), 1400);
      return () => clearTimeout(t);
    }
  }, [pasoCompletado, step.id, isLast, steps.length]);

  const handlePlay = () => {
    if (playing) {
      audio.stopGuide();
      setPlaying(false);
    } else {
      setPlaying(true);
      audio.playGuide(mision || step.mensaje);
      setTimeout(() => setPlaying(false), 8000);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── BOTÓN DE AUDIO — en la parte superior ── */}
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          className={`flex-1 h-10 rounded-2xl flex items-center justify-center gap-2.5 text-[9px] font-black uppercase tracking-widest transition-all border
            ${playing
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-white/10 border-white/10 text-blue-100 hover:bg-white/20'
            }`}
        >
          {playing
            ? <><Square size={11} fill="currentColor" /> Detener</>
            : <><Volume2 size={13} /> Escuchar el Ejercicio</>
          }
        </button>
      </div>

      {/* ── BARRA DE PROGRESO CON DOTS ── */}
      <div className="flex gap-1 px-1">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrent(i)}
            className="relative flex-1 h-1 rounded-full overflow-hidden transition-all"
            title={s.pista}
          >
            <div className="absolute inset-0 bg-white/10 rounded-full" />
            {i <= current && (
              <motion.div
                initial={{ width: 0 }} animate={{ width: "100%" }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 rounded-full"
                style={{ background: accent }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── FICHA PRINCIPAL ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -24, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative rounded-[2rem] overflow-hidden border border-white/10"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" }}
        >
          {/* Glow de acento */}
          <div
            className="absolute -top-8 -left-8 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none"
            style={{ background: accent }}
          />

          <div className="relative z-10 p-5">
            {/* Cabecera — paso y hint */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}
              >
                <TipoIcon tipo={step.tipo} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none" style={{ color: accent }}>
                {step.pista}
              </span>
              <span className="ml-auto text-[7px] font-bold text-white/20">
                {current + 1}/{steps.length}
              </span>
              {done && (
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
              )}
            </div>

            {/* Mascota + burbuja */}
            <div className="flex gap-3 items-start">
              {/* Avatar */}
              <div className="w-12 h-12 relative shrink-0">
                {!imgError ? (
                  <Image
                    src="/assets/art/mascotas/dr_quantum_neutral.png"
                    alt="Dr. Quantum"
                    fill
                    className="object-contain drop-shadow-xl"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${accent}15`, border: `1.5px solid ${accent}30` }}
                  >
                    🧑‍🔬
                  </div>
                )}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
                  style={{ background: accent }}
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              {/* Texto conversacional */}
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black mb-1 uppercase tracking-widest" style={{ color: accent }}>
                  Dr. Quantum
                </div>
                <p className="text-[11.5px] font-bold text-slate-200 leading-relaxed">
                  {typed}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.55, repeat: Infinity }}
                      className="inline-block ml-0.5 w-0.5 h-3 rounded-sm align-middle"
                      style={{ background: accent }}
                    />
                  )}
                </p>
              </div>
            </div>

            {/* Botón de acción contextual */}
            {step.accion && !isTyping && (
              <motion.button
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => onAccion?.(step.id)}
                className="mt-3 w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                style={{ background: accent, color: "#000" }}
              >
                {step.accion}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── NAVEGACIÓN ENTRE FICHAS ── */}
      <div className="flex items-center gap-2">
        <button
          disabled={isFirst}
          onClick={() => setCurrent(c => c - 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-white/5"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Dots navegables */}
        <div className="flex-1 flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{
                width:  i === current ? 20 : 6,
                height: 6,
                background: i === current ? accent : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        {!isLast ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/10"
          >
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={() => setCurrent(0)}
            title="Reiniciar guía"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-amber-400 hover:bg-amber-400/10 transition-all border border-white/5"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* ── TARJETA ÍNDICE — todos los pasos como lista compacta ── */}
      <div className="bg-black/30 rounded-2xl border border-white/5 p-4 space-y-1.5">
        <span className="text-[7px] font-black text-white/20 uppercase tracking-widest block mb-2">Índice del Tutorial</span>
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrent(i)}
            className={`w-full flex items-center gap-2 text-left rounded-lg px-2 py-1.5 transition-all ${i === current ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center text-[7px] font-black shrink-0 transition-all ${i < current ? '' : ''}`}
              style={{
                background: i < current ? `${accentColor[s.tipo]}30` : i === current ? `${accentColor[s.tipo]}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${i <= current ? accentColor[s.tipo] + '50' : 'rgba(255,255,255,0.05)'}`,
                color: i < current ? accentColor[s.tipo] : i === current ? accentColor[s.tipo] : 'rgba(255,255,255,0.2)',
              }}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              className="text-[9px] font-bold leading-none"
              style={{ color: i === current ? 'white' : i < current ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)' }}
            >
              {s.pista}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}
