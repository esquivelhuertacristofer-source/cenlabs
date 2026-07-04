"use client";

/**
 * MecanicaShellClient.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shell de plataforma para los 10 laboratorios 3D de Mecánica e Ingeniería.
 *
 * Sustituye al MecanicaLabClient (iframe fullscreen sin chrome) con el shell
 * estándar de dos barras laterales de CEN Labs:
 *   - Izquierda (30%): guía de misión, conceptos clave, tab docente
 *   - Centro (flex-1): iframe del lab three.js (los HTML se preservan intactos)
 *   - Derecha (380px): BitacoraMecanica con conceptos de referencia y notas
 *   - Header (h-20): código del lab, temporizador, fullscreen, salir
 *
 * El MissionBriefing inicial es el mismo componente que usan los otros labs.
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Maximize2, Minimize2, Power,
  Play, FileText, Globe2, Target, ChevronRight, Timer,
} from "lucide-react";
import MissionBriefing from "@/components/MissionBriefing";
import AsistenteVirtual from "@/components/AsistenteVirtual";
import { ALL_BRIEFING_CONFIGS } from "@/data/briefingConfigs";
import { supabase } from "@/lib/supabase-browser";
import { getCurrentProfile } from "@/lib/supabase-helpers";
import BitacoraMecanica from "@/components/bitacoras/BitacoraMecanica";

const LAB_HTML: Record<string, string> = {
  "mecanica-1":  "/labs/motor-electrico.html",
  "mecanica-2":  "/labs/motor-combustion.html",
  "mecanica-3":  "/labs/brazo-robotico.html",
  "mecanica-4":  "/labs/inversor-trifasico.html",
  "mecanica-5":  "/labs/carga-ev.html",
  "mecanica-6":  "/labs/inyeccion-electronica.html",
  "mecanica-7":  "/labs/frenos-abs.html",
  "mecanica-8":  "/labs/bateria-bms.html",
  "mecanica-9":  "/labs/plc-neumatica.html",
  "mecanica-10": "/labs/direccion-eps.html",
};

// ─── Timer local (no necesita el store de Zustand) ────────────────────────────
function LabTimer({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-white/70 border border-white/10">
      <Timer size={16} />
      <span className="text-xs font-black tabular-nums">
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
      </span>
    </div>
  );
}

// ─── Shell principal ──────────────────────────────────────────────────────────
export default function MecanicaShellClient({
  simuladorId,
}: {
  simuladorId: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted]           = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]       = useState<"guia" | "docente">("guia");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const htmlSrc = LAB_HTML[simuladorId] ?? LAB_HTML["mecanica-1"];
  const config  = ALL_BRIEFING_CONFIGS[simuladorId] ?? ALL_BRIEFING_CONFIGS["mecanica-1"];
  const acento  = config?.acento ?? "#2A9D8F";

  // Registro de visita (mismo patrón que MecanicaLabClient / SimuladorClient)
  useEffect(() => {
    setMounted(true);
    setIsSidebarOpen(window.innerWidth >= 768);
    const recordVisit = async () => {
      try {
        localStorage.setItem("last_simulation_id", simuladorId);
        const user = await getCurrentProfile();
        if (user) {
          await supabase.from("intentos").upsert(
            {
              id_alumno:  user.id,
              sim_id:     simuladorId,
              status:     "in_progress",
              started_at: new Date().toISOString(),
            },
            { onConflict: "id_alumno, sim_id, status" }
          );
        }
      } catch (e) {
        console.error("[MecanicaShell] Error al registrar visita:", e);
      }
    };
    recordVisit();
  }, [simuladorId]);

  // Sincroniza estado del botón con la Fullscreen API nativa
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-[#08201C] flex items-center justify-center z-[200]">
        <div
          className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${acento} transparent transparent transparent` }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-['Outfit'] antialiased relative"
    >
      {/* ══════════════════════════════════════════════════════════════
          BARRA LATERAL IZQUIERDA
      ══════════════════════════════════════════════════════════════ */}
      <motion.aside
        animate={{ width: isSidebarOpen ? "30%" : "80px" }}
        className="bg-[#023047] text-white flex flex-col z-20 shadow-2xl overflow-hidden relative shrink-0"
      >
        {/* Header de la barra */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h1
            className={`font-black uppercase tracking-tighter transition-all ${
              isSidebarOpen ? "text-2xl" : "text-xs scale-0"
            }`}
          >
            CEN Labs
          </h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {isSidebarOpen && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-6 space-y-6 flex-1">

              {/* Tarjeta del lab */}
              <div
                className="p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group border border-white/10"
                style={{ background: `linear-gradient(135deg, ${acento}cc 0%, #023047 100%)` }}
              >
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                    {config?.subtitulo ?? "Mecánica e Ingeniería"}
                  </span>
                  <h2 className="text-xl font-black uppercase leading-tight mt-1 drop-shadow-lg">
                    {config?.titulo ?? "Laboratorio 3D"}
                  </h2>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-white/10 border border-white/20">
                      {config?.codigo ?? simuladorId.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-white/50">
                      {config?.duracion} min
                    </span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("guia")}
                  className="flex-1 py-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  style={
                    activeTab === "guia"
                      ? { backgroundColor: acento, color: "#fff" }
                      : { backgroundColor: "rgba(255,255,255,0.05)", color: "#94a3b8" }
                  }
                >
                  Guía
                </button>
                <button
                  onClick={() => setActiveTab("docente")}
                  className={`flex-1 py-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "docente"
                      ? "bg-[#FB8500] text-white"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  Docente
                </button>
              </div>

              {/* ── Tab: Guía ── */}
              {activeTab === "guia" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Misión */}
                  <div className="space-y-3">
                    <span
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: acento }}
                    >
                      Misión
                    </span>
                    {config?.mision?.map((paso, i) => (
                      <div key={i} className="relative pl-8 pb-2">
                        <div
                          className="absolute left-0 top-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: `${acento}33`, color: acento }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-xs font-bold leading-snug text-white/80">
                          {paso}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Conceptos clave */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Conceptos Clave
                    </span>
                    {config?.conceptos?.map((c, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{c.icono}</span>
                          <span className="text-[11px] font-black text-white uppercase tracking-wide">
                            {c.nombre}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {c.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: Docente ── */}
              {activeTab === "docente" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Aplicaciones reales */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe2 size={12} style={{ color: acento }} />
                      <span
                        className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: acento }}
                      >
                        Aplicaciones Reales
                      </span>
                    </div>
                    {config?.aplicaciones?.map((a, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <span className="text-[10px] font-black text-white uppercase block mb-1">
                          {a.area}
                        </span>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {a.ejemplo}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Retos de dominio */}
                  {(config?.retos?.length ?? 0) > 0 && (
                    <div className="p-5 bg-[#FB8500]/10 rounded-3xl border border-[#FB8500]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Target size={12} className="text-[#FB8500]" />
                        <span className="text-[10px] font-black text-[#FB8500] uppercase tracking-widest">
                          Retos de Dominio
                        </span>
                      </div>
                      <div className="space-y-2">
                        {config?.retos?.map((r, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <ChevronRight
                              size={12}
                              className="text-[#FB8500] mt-0.5 shrink-0"
                            />
                            <span className="text-[10px] font-bold text-orange-100/80 leading-snug">
                              {r}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video de apoyo */}
                  {config?.videoUrl && (
                    <a
                      href={config.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                        <Play size={14} className="text-red-400" fill="currentColor" />
                      </div>
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest group-hover:text-white transition-colors">
                        Ver Video de Apoyo
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Dr. Quantum HUD */}
            <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
              <AsistenteVirtual
                isVisible={isSidebarOpen}
                onClose={() => {}}
                text="Observa cada fase del lab 3D. Documenta tus hallazgos en la bitácora de la derecha. El diagnóstico de fallas es la prueba de fuego de un técnico CEN."
                showButton={false}
                title="DR. QUANTUM"
                variant="sidebar-hud"
              />
            </div>
          </div>
        )}
      </motion.aside>

      {/* ══════════════════════════════════════════════════════════════
          MAIN AREA (header + lab + bitácora)
      ══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#023047] border-b border-white/10 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            {/* Código del lab */}
            <div
              className="px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest shrink-0"
              style={{
                borderColor: `${acento}50`,
                color: acento,
                backgroundColor: `${acento}15`,
              }}
            >
              {config?.codigo ?? simuladorId.toUpperCase()}
            </div>
            <LabTimer active={!showBriefing} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={() => setShowExitModal(true)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 flex items-center justify-center hover:text-red-400 hover:border-red-400/50 transition-all"
              title="Salir del laboratorio"
            >
              <Power size={16} />
            </button>
          </div>
        </header>

        {/* Lab + Bitácora */}
        <div className="flex-1 flex overflow-hidden">
          {/* Centro: iframe del lab three.js */}
          <div className="flex-1 relative bg-[#080b10]">
            {!showBriefing && (
              <iframe
                key={simuladorId}
                src={htmlSrc}
                title={config?.titulo ?? "Laboratorio de Mecánica"}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; xr-spatial-tracking"
              />
            )}
          </div>

          {/* Derecha: Bitácora */}
          <div className="w-[380px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
            <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center gap-2">
              <FileText size={12} className="text-slate-400" />
              <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
                Bitácora de Observaciones
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <BitacoraMecanica config={config} simuladorId={simuladorId} />
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          OVERLAYS
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {showBriefing && (
          <MissionBriefing
            key="briefing"
            config={config}
            onStart={() => setShowBriefing(false)}
          />
        )}

        {showExitModal && (
          <div
            key="exit-modal"
            className="fixed inset-0 z-[300] flex items-center justify-center bg-[#023047]/60 backdrop-blur-md"
          >
            <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center border-b-[12px] border-red-500 shadow-2xl">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Power size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#023047] uppercase mb-2 tracking-tighter">
                ¿Pausar Sesión?
              </h3>
              <p className="text-xs font-bold text-slate-400 mb-8">
                Tu progreso en el lab se conserva localmente.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Seguir
                </button>
                <button
                  onClick={() => router.push("/alumno/laboratorio/mecanica")}
                  className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
