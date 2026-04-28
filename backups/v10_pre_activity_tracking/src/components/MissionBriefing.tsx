"use client";

/**
 * MissionBriefing.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Pantalla previa al laboratorio. Se muestra sobre el simulador desenfocado.
 * Contiene: bienvenida del Dr. Quantum, conceptos, misión, aplicaciones reales
 * y un botón de "Iniciar Práctica" que la descarta con animación de salida.
 *
 * Uso: <MissionBriefing config={...} onStart={() => setBriefingDone(true)} />
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, BookOpen, Lightbulb, Globe2,
  ChevronDown, ArrowRight, X, GraduationCap,
} from "lucide-react";
import Image from "next/image";
import { InlineMath } from "react-katex";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface BriefingConfig {
  /** Código del laboratorio, ej: "MAT-01" */
  codigo: string;
  /** Nombre de la práctica */
  titulo: string;
  /** Subtítulo o categoría */
  subtitulo: string;
  /** Mensaje de bienvenida del Dr. Quantum (puede usar \n) */
  bienvenida: string;
  /** Tiempo estimado en minutos */
  duracion: number;
  /** Conceptos clave que se explorarán */
  conceptos: { icono: string; nombre: string; descripcion: string }[];
  /** Lo que el alumno hará en la práctica */
  mision: string[];
  /** Aplicaciones reales de este conocimiento */
  aplicaciones: { area: string; ejemplo: string }[];
  /** Color de acento primario (hex) */
  acento?: string;
}

interface MissionBriefingProps {
  config: BriefingConfig;
  onStart: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function MissionBriefing({ config, onStart }: MissionBriefingProps) {
  const [imgError, setImgError] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const acento = config.acento ?? "#219EBC";

  const handleStart = () => {
    setExiting(true);
    setTimeout(onStart, 700);
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="briefing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          // Overlay full-screen sobre el simulador desenfocado
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: "rgba(4, 12, 28, 0.88)", backdropFilter: "blur(18px)" }}
        >
          {/* ── Partículas de fondo (decoración) ── */}
          <Particles acento={acento} />

          {/* ── Card Central ── */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-4xl max-h-[92vh] mx-4 flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
            style={{
              background: "linear-gradient(145deg, rgba(10,18,38,0.98) 0%, rgba(6,12,28,0.99) 100%)",
            }}
          >
            {/* Glow superior de acento */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[2.5rem]"
              style={{ background: `linear-gradient(90deg, transparent, ${acento}, transparent)` }}
            />
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 blur-[80px] opacity-25 pointer-events-none"
              style={{ background: acento }}
            />

            {/* ════════════════════════════════════
                HEADER — Código + Badge
            ════════════════════════════════════ */}
            <div className="flex items-center justify-between px-10 pt-8 pb-0 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.25em]"
                  style={{ background: `${acento}20`, color: acento, border: `1px solid ${acento}40` }}
                >
                  {config.codigo}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                  <GraduationCap size={10} className="text-white/30" />
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Nivel Licenciatura</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/20">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: acento }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <span className="text-[9px] font-bold uppercase tracking-widest">{config.duracion} min estimados</span>
              </div>
            </div>

            {/* ════════════════════════════════════
                CUERPO SCROLLABLE
            ════════════════════════════════════ */}
            <div
              className="flex-1 overflow-y-auto px-10 py-8 space-y-10"
              style={{ scrollbarWidth: "thin", scrollbarColor: `${acento}40 transparent` }}
              onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 20)}
            >

              {/* ── BLOQUE HERO: Mascota + Texto de bienvenida ── */}
              <div className="flex gap-8 items-end">
                {/* Mascota grande */}
                <div className="relative w-44 h-44 shrink-0 hidden sm:block">
                  <div
                    className="absolute inset-0 rounded-full blur-[40px] opacity-30"
                    style={{ background: acento }}
                  />
                  {!imgError ? (
                    <Image
                      src="/assets/art/mascotas/dr_quantum_happy.png"
                      alt="Dr. Quantum"
                      fill
                      className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] relative z-10"
                      onError={() => {
                        setImgError(true);
                      }}
                    />
                  ) : (
                    /* Fallback avatar si no hay imagen */
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-6xl border-2 border-dashed"
                      style={{ background: `${acento}10`, borderColor: `${acento}30` }}
                    >
                      🧑‍🔬
                    </div>
                  )}
                  {/* Nombre badge */}
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap"
                    style={{ background: acento, color: "#000" }}
                  >
                    Dr. Quantum
                  </div>
                </div>

                {/* Texto hero */}
                <div className="flex-1 min-w-0">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-[10px] font-black uppercase tracking-[0.3em] mb-3"
                    style={{ color: acento }}
                  >
                    Bienvenida al Laboratorio
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4 tracking-tight"
                  >
                    {config.titulo}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.75 }}
                    className="text-[13px] font-bold text-slate-300/80 leading-relaxed"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {config.bienvenida}
                  </motion.p>
                </div>
              </div>

              {/* ── CONCEPTOS FUNDAMENTALES ── */}
              <Section title="Conceptos Fundamentales" icon={<BookOpen size={14} />} acento={acento}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {config.conceptos.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="p-4 rounded-2xl border border-white/5 bg-white/3 hover:bg-white/5 transition-colors"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="text-2xl mb-2">{c.icono}</div>
                      <div className="text-[11px] font-black text-white mb-1">{c.nombre}</div>
                      <p className="text-[10px] text-slate-400 leading-snug">{c.descripcion}</p>
                    </motion.div>
                  ))}
                </div>
              </Section>

              {/* ── MISIÓN ── */}
              <Section title="Tu Misión en Esta Práctica" icon={<Rocket size={14} />} acento={acento}>
                <ol className="space-y-3">
                  {config.mision.map((paso, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex items-start gap-4"
                    >
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                        style={{ background: `${acento}20`, color: acento, border: `1px solid ${acento}30` }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-[12px] font-bold text-slate-200 leading-relaxed pt-0.5">{paso}</p>
                    </motion.li>
                  ))}
                </ol>
              </Section>

              {/* ── APLICACIONES REALES ── */}
              <Section title="¿Para Qué Sirve en la Vida Real?" icon={<Globe2 size={14} />} acento={acento}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.aplicaciones.map((ap, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.07 }}
                      className="flex gap-3 p-4 rounded-2xl border border-white/5"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div
                        className="w-1.5 rounded-full shrink-0 mt-1"
                        style={{ background: acento, minHeight: 32 }}
                      />
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: acento }}>
                          {ap.area}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">{ap.ejemplo}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Section>

              {/* ── NOTA FINAL ── */}
              <div
                className="flex items-start gap-3 p-4 rounded-2xl border"
                style={{ background: `${acento}08`, borderColor: `${acento}25` }}
              >
                <Lightbulb size={16} className="shrink-0 mt-0.5" style={{ color: acento }} />
                <p className="text-[11px] font-bold leading-relaxed" style={{ color: `${acento}CC` }}>
                  Tip del Dr. Quantum: Antes de ajustar los controles, calcula mentalmente el discriminante <InlineMath math="\Delta = b^2 - 4ac" />. 
                  Si <InlineMath math="\Delta > 0" /> habrá dos cortes reales; si <InlineMath math="\Delta < 0" /> entraremos en el plano complejo. 
                  ¡Predice el comportamiento antes de experimentar!
                </p>
              </div>

              {/* Espaciado final para que el botón sticky no tape el contenido */}
              <div className="h-4" />
            </div>

            {/* ════════════════════════════════════
                FOOTER — Botón sticky
            ════════════════════════════════════ */}
            <div
              className="shrink-0 px-10 py-6 border-t border-white/5 flex items-center justify-between"
              style={{ background: "rgba(4, 12, 28, 0.95)", backdropFilter: "blur(20px)" }}
            >
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">
                  Práctica {config.codigo}
                </p>
                <p className="text-[12px] font-bold text-slate-400">{config.subtitulo}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.04, x: 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
                className="group flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-black shadow-2xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${acento}, ${acento}CC)`,
                  boxShadow: `0 12px 40px ${acento}50`,
                }}
              >
                <Rocket size={16} className="group-hover:rotate-12 transition-transform" />
                Iniciar Práctica
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>

          {/* Indicador de scroll si hay contenido abajo */}
          {!scrolled && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 2, repeat: Infinity, repeatType: "reverse" }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20 pointer-events-none"
            >
              <ChevronDown size={16} />
              <span className="text-[8px] uppercase tracking-widest">Scroll</span>
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─── Sub-componente: Sección con título ───────────────────────────────────────
function Section({
  title, icon, acento, children,
}: { title: string; icon: React.ReactNode; acento: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${acento}20`, color: acento }}
        >
          {icon}
        </div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">{title}</h2>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      {children}
    </div>
  );
}

// ─── Sub-componente: Partículas flotantes de decoración ───────────────────────
function Particles({ acento }: { acento: string }) {
  const items = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-10"
          style={{
            width:  Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            background: acento,
            left:   `${Math.random() * 100}%`,
            top:    `${Math.random() * 100}%`,
          }}
          animate={{
            y:       [0, -30 - Math.random() * 40, 0],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat:   Infinity,
            delay:    Math.random() * 4,
            ease:     "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
