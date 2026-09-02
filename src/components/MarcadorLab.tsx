"use client";

/**
 * EL MARCADOR DEL LAB: lo que el alumno lleva ganado, mientras lo gana.
 *
 * POR QUÉ EXISTE. Hasta ahora una práctica de mecánica no daba ninguna señal de
 * avance: el alumno resolvía el reto y no pasaba nada visible, cerraba la
 * pestaña y no quedaba rastro. Sin devolución no hay motivo para terminar nada,
 * y por eso los labs se sentían como una demostración y no como una práctica.
 * Esto es la mitad visible del puente (`src/lib/puente.ts`): la otra mitad es
 * la que guarda.
 *
 * NO ES UN PREMIO POR ESTAR. Los cuatro conceptos son los mismos que se
 * guardan, con los mismos pesos, y se ven desde el primer segundo: el alumno
 * puede leer qué le falta en vez de adivinarlo. Un marcador que sólo diga un
 * número no enseña nada.
 *
 * Y DICE CUÁNDO NO PUEDE SABER. En los labs que no publican su estado el
 * marcador no finge: enseña lo que sí midió y marca lo demás como no observable,
 * en vez de un cero que el alumno leería como un suspenso.
 */

import { useMemo } from "react";
import { Check, Minus } from "lucide-react";
import { resumeDe } from "@/lib/puente";
import type { Sesion } from "@/lib/puente";

export default function MarcadorLab({ sesion, acento }: { sesion: Sesion; acento: string }) {
  const r = useMemo(() => resumeDe(sesion), [sesion]);

  // Antes de que el lab monte no hay nada que marcar, y un 0 en pantalla
  // mientras carga se lee como un suspenso.
  if (!sesion.monto) return null;

  return (
    <div className="hidden md:flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-2" title={r.evaluable
        ? "Avance de la práctica"
        : "Este laboratorio no publica su resultado: se mide la participación, no el logro"}
      >
        <div className="relative w-9 h-9 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
            <circle
              cx="18" cy="18" r="15.5" fill="none"
              stroke={acento} strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={`${(r.score / 100) * 97.4} 97.4`}
              style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.23,1,0.32,1)" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white tabular-nums">
            {r.score}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {r.detalle.map((d) => {
            const logrado = d.medido && d.puntos >= d.de && d.de > 0;
            return (
              <span
                key={d.concepto}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider leading-none"
                style={{
                  color: !d.medido ? "rgba(255,255,255,0.28)"
                    : logrado ? acento
                      : "rgba(255,255,255,0.55)",
                }}
                title={d.medido
                  ? `${d.puntos} de ${d.de} puntos`
                  : "Este laboratorio no informa de esto"}
              >
                {d.medido
                  ? <Check size={9} strokeWidth={4} style={{ opacity: logrado ? 1 : 0.25 }} />
                  : <Minus size={9} strokeWidth={4} />}
                {etiquetaCorta(d.concepto)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** El nombre largo es para el expediente; en la barra no cabe. */
function etiquetaCorta(concepto: string): string {
  if (concepto.startsWith("Reto")) return "Reto";
  if (concepto.startsWith("Cuestionario")) return "Quiz";
  if (concepto.startsWith("Vistas")) return "Vistas";
  return "Tiempo";
}
