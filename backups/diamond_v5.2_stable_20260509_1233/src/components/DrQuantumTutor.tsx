"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CheckCircle2,
  Lightbulb, Zap, RotateCcw, Volume2, Square
} from "lucide-react";
import Image from "next/image";
import { audio } from "@/utils/audioEngine";

export type TutorStep = {
  id: number;
  mensaje: string;
  pista: string;
  tipo: "intro" | "calculo" | "accion" | "verificar" | "logro";
  accion?: string;
};

interface DrQuantumTutorProps {
  steps: TutorStep[];
  pasoCompletado?: number;
  onAccion?: (stepId: number) => void;
  nombreAlumno?: string;
  mision?: string;
  // Prop opcional para feedback de objetivos específicos (ej. Z, A, Carga)
  objetivos?: { label: string; current: number; target: number; completed: boolean }[];
}

const accentColor: Record<string, string> = {
  intro: "#FB8500",
  calculo: "#22d3ee",
  accion: "#f43f5e",
  verificar: "#10b981",
  logro: "#fbbf24",
};

export default function DrQuantumTutor({
  steps,
  pasoCompletado = 0,
  onAccion,
  nombreAlumno = "Estudiante",
  mision = "",
  objetivos = []
}: DrQuantumTutorProps) {
  const [current, setCurrent] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [typed, setTyped] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [playing, setPlaying] = useState(false);

  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;
  const accent = accentColor[step.tipo] || "#219EBC";

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
    }, 12);
    return () => clearInterval(timer);
  }, [current, step.mensaje, nombreAlumno]);

  const handlePlay = () => {
    if (playing) {
      audio.stopGuide();
      setPlaying(false);
    } else {
      setPlaying(true);
      audio.playNotification();
      setTimeout(() => setPlaying(false), 12000);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      
      {/* ── BOTÓN DE AUDIO ── */}
      <button
        onClick={handlePlay}
        className={`w-full h-12 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border shadow-lg
          ${playing 
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
            : 'bg-white/5 border-white/10 text-blue-100 hover:bg-white/10'
          }`}
      >
        {playing ? <Square size={14} fill="currentColor" /> : <Volume2 size={16} />}
        {playing ? 'Detener Explicación' : 'Escuchar Misión'}
      </button>

      {/* ── FICHA DEL TUTOR ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-3xl p-8 flex flex-col items-center text-center shadow-2xl"
        >
          {/* Acento decorativo */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none" style={{ background: accent }} />

          {/* Avatar del Dr. Quantum (GRANDE) */}
          <div className="w-28 h-28 relative mb-6">
            {!imgError ? (
              <Image
                src="/assets/art/mascotas/dr_quantum_neutral.png"
                alt="Dr. Quantum"
                fill
                className="object-contain drop-shadow-[0_10px_40px_rgba(33,158,188,0.5)]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-3xl flex items-center justify-center text-5xl bg-white/5 border-2 border-white/10 shadow-inner">🧑‍🔬</div>
            )}
          </div>

          <div className="w-full">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 block" style={{ color: accent }}>Asesoría Científica</span>
            <p className="text-[15px] font-bold text-white leading-relaxed mb-6">
              {typed}
              {isTyping && <span className="inline-block ml-1 w-1.5 h-4 align-middle bg-blue-400 animate-pulse" />}
            </p>
          </div>

          {/* CHECKLIST DE OBJETIVOS (Si existen) */}
          {objetivos.length > 0 && (
            <div className="w-full grid grid-cols-1 gap-2 mb-4">
              {objetivos.map((obj, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${obj.completed ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-white/5 border-white/5 text-white/40'}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest">{obj.label}</span>
                  <span className="text-[10px] font-black">{obj.completed ? 'COMPLETADO' : `${obj.current} / ${obj.target}`}</span>
                </div>
              ))}
            </div>
          )}

          {step.accion && !isTyping && (
            <button
              onClick={() => onAccion?.(step.id)}
              className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shadow-lg"
              style={{ background: accent, color: '#000' }}
            >
              {step.accion}
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── NAVEGACIÓN ── */}
      <div className="flex items-center justify-between px-2">
        <button disabled={isFirst} onClick={() => setCurrent(c => c - 1)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all"><ChevronLeft size={18} /></button>
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-blue-400 w-6' : 'bg-white/10'}`} />
          ))}
        </div>
        <button disabled={isLast} onClick={() => setCurrent(c => c + 1)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
