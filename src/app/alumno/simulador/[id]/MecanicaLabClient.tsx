"use client";

/**
 * MecanicaLabClient.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shell dedicado para los laboratorios de "Mecánica e Ingeniería".
 *
 * A diferencia del resto de disciplinas (que se renderizan dentro de
 * SimuladorClient con su sidebar/bitácora/validador), estos labs son
 * experiencias 3D (three.js) autónomas y a pantalla completa que ya traen su
 * propia guía por fases, panel de instrucción y sistema de feedback.
 *
 * Por eso aquí solo hacemos la ADAPTACIÓN a la plataforma:
 *   1. Mostramos la "ficha" (MissionBriefing) igual que los demás labs.
 *   2. Al iniciar, embebemos el HTML construido vía <iframe> a pantalla completa.
 *   3. Registramos la visita en Supabase para el conteo de progreso.
 *
 * Los HTML viven en /public/labs/*.html y se preservan tal cual fueron
 * construidos (matemática y gráficamente).
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Maximize2, Minimize2, Cog } from "lucide-react";
import MissionBriefing from "@/components/MissionBriefing";
import { ALL_BRIEFING_CONFIGS } from "@/data/briefingConfigs";
import { supabase } from "@/lib/supabase-browser";
import { getCurrentProfile } from "@/lib/supabase-helpers";

// Mapa id de plataforma → archivo HTML servido en /public/labs
const LAB_HTML: Record<string, string> = {
  "mecanica-1": "/labs/motor-electrico.html",
  "mecanica-2": "/labs/motor-combustion.html",
  "mecanica-3": "/labs/brazo-robotico.html",
  "mecanica-4": "/labs/inversor-trifasico.html",
  "mecanica-5": "/labs/carga-ev.html",
};

export default function MecanicaLabClient({ simuladorId }: { simuladorId: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const htmlSrc = LAB_HTML[simuladorId] || LAB_HTML["mecanica-1"];
  const config = ALL_BRIEFING_CONFIGS[simuladorId] || ALL_BRIEFING_CONFIGS["mecanica-1"];

  useEffect(() => {
    setMounted(true);

    // Registro de visita (idéntico patrón a SimuladorClient)
    const recordVisit = async () => {
      try {
        localStorage.setItem("last_simulation_id", simuladorId);
        const currentUser = await getCurrentProfile();
        if (currentUser) {
          await supabase.from("intentos").upsert(
            {
              id_alumno: currentUser.id,
              sim_id: simuladorId,
              status: "in_progress",
              started_at: new Date().toISOString(),
            },
            { onConflict: "id_alumno, sim_id, status" }
          );
        }
      } catch (e) {
        console.error("[MecanicaLab] No se pudo registrar la visita:", e);
      }
    };
    recordVisit();
  }, [simuladorId]);

  // Sincroniza el estado del botón con la Fullscreen API nativa
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
        <div className="w-16 h-16 border-4 border-[#2A9D8F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#080b10] font-['Outfit']">
      {/* Lab 3D embebido a pantalla completa */}
      {!showBriefing && (
        <iframe
          key={simuladorId}
          src={htmlSrc}
          title={config?.titulo || "Laboratorio de Mecánica"}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
        />
      )}

      {/* Controles flotantes de la plataforma (no estorban al lab) */}
      {!showBriefing && (
        <div className="absolute top-4 left-4 z-[50] flex items-center gap-2">
          <button
            onClick={() => router.push("/alumno/laboratorio/mecanica")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-black uppercase tracking-widest hover:bg-black/80 hover:border-[#2A9D8F]/60 transition-all"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Salir del lab</span>
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/90 flex items-center justify-center hover:bg-black/80 hover:border-[#2A9D8F]/60 transition-all"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2A9D8F]/20 backdrop-blur-md border border-[#2A9D8F]/30 text-[#4FD1C5] text-[11px] font-black uppercase tracking-widest">
            <Cog size={14} />
            <span className="hidden md:inline">CEN Labs · Mecánica</span>
          </div>
        </div>
      )}

      {/* Ficha del laboratorio (misma que el resto de disciplinas) */}
      {showBriefing && config && (
        <MissionBriefing config={config} onStart={() => setShowBriefing(false)} />
      )}
    </div>
  );
}
