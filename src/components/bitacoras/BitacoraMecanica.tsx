"use client";

/**
 * BitacoraMecanica.tsx
 * Panel de referencia y observaciones para los labs 3D de Mecánica/Autotrónica.
 * Muestra: conceptos clave (cards de referencia), retos (checklist interactivo),
 * aplicaciones reales, y un bloc de notas libre.
 * Todo el estado es local — los labs HTML gestionan su propia física internamente.
 */

import React, { useState } from "react";
import { CheckCircle2, Circle, BookOpen, Target, Globe2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import type { BriefingConfig } from "@/components/MissionBriefing";

interface Props {
  /**
   * Puede ser null: el briefing se pide como activo estático y la petición puede
   * fallar (ver @/data/briefingConfigs). El cuerpo de este componente ya leía todo
   * con `config?.`, así que degrada a un panel sin conceptos ni retos —el bloc de
   * notas sigue sirviendo—; el tipo ahora dice la verdad de lo que puede llegar.
   */
  config: BriefingConfig | null;
  simuladorId: string;
}

export default function BitacoraMecanica({ config, simuladorId }: Props) {
  const acento = config?.acento ?? "#2A9D8F";
  const [retosCheck, setRetosCheck] = useState<boolean[]>(
    () => new Array(config?.retos?.length ?? 0).fill(false)
  );
  const [notes, setNotes] = useState("");
  const [expandedConcepto, setExpandedConcepto] = useState<number | null>(null);

  const toggleReto = (i: number) =>
    setRetosCheck((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const retosCompleted = retosCheck.filter(Boolean).length;
  const retosTotal     = retosCheck.length;

  return (
    <div className="space-y-5 pb-10 font-['Outfit'] animate-in fade-in duration-300">

      {/* ── Conceptos clave ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={12} style={{ color: acento }} />
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: acento }}
          >
            Conceptos de Referencia
          </span>
        </div>

        <div className="space-y-2">
          {config?.conceptos?.map((c, i) => {
            const open = expandedConcepto === i;
            return (
              <button
                key={i}
                onClick={() => setExpandedConcepto(open ? null : i)}
                className="w-full text-left p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{c.icono}</span>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                      {c.nombre}
                    </span>
                  </div>
                  {open
                    ? <ChevronUp size={12} className="text-slate-400 shrink-0" />
                    : <ChevronDown size={12} className="text-slate-400 shrink-0" />
                  }
                </div>
                {open && (
                  <p className="mt-3 text-[10px] text-slate-500 leading-relaxed font-medium border-t border-slate-100 pt-3">
                    {c.descripcion}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Retos de dominio (checklist) ──────────────────────────── */}
      {retosTotal > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={12} className="text-[#FB8500]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FB8500]">
                Retos de Dominio
              </span>
            </div>
            <span className="text-[10px] font-black text-slate-400">
              {retosCompleted}/{retosTotal}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: retosTotal ? `${(retosCompleted / retosTotal) * 100}%` : "0%",
                backgroundColor: retosCompleted === retosTotal ? acento : "#FB8500",
              }}
            />
          </div>

          <div className="space-y-2">
            {config?.retos?.map((r, i) => (
              <button
                key={i}
                onClick={() => toggleReto(i)}
                className="w-full flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-orange-200 text-left transition-all group"
              >
                {retosCheck[i]
                  ? <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#2A9D8F]" />
                  : <Circle size={16} className="shrink-0 mt-0.5 text-slate-300 group-hover:text-orange-300" />
                }
                <span
                  className={`text-[11px] font-bold leading-snug transition-colors ${
                    retosCheck[i] ? "text-slate-400 line-through" : "text-slate-700"
                  }`}
                >
                  {r}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Aplicaciones reales ───────────────────────────────────── */}
      {(config?.aplicaciones?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Globe2 size={12} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Aplicaciones Reales
            </span>
          </div>
          <div className="space-y-2">
            {config?.aplicaciones?.map((a, i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <span
                  className="text-[10px] font-black uppercase tracking-wide block mb-1"
                  style={{ color: acento }}
                >
                  {a.area}
                </span>
                <p className="text-[10px] text-slate-500 leading-snug font-medium">
                  {a.ejemplo}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Notas de observación ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Pencil size={12} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Mis Observaciones
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anota aquí tus hallazgos, valores medidos, hipótesis o dudas mientras interactúas con el simulador 3D…"
          rows={6}
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-medium text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-offset-0 transition-all leading-relaxed"
          style={{ "--tw-ring-color": `${acento}40` } as React.CSSProperties}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">
            {simuladorId.toUpperCase()}
          </span>
          <span className="text-[9px] text-slate-300">
            {notes.trim().split(/\s+/).filter(Boolean).length} palabras
          </span>
        </div>
      </section>
    </div>
  );
}
