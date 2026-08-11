"use client";

/**
 * src/hooks/useBriefing.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Carga la portada de misión del lab que se está abriendo.
 *
 * Antes los shells leían `ALL_BRIEFING_CONFIGS[id]` de un mapa con los 160
 * briefings ya en memoria — y por tanto dentro del bundle del worker. Ahora cada
 * briefing es un activo estático que se pide al montar (ver @/data/briefingConfigs).
 * Ese cambio introduce un estado que antes no existía: el instante en que el
 * componente ya montó pero el briefing todavía no llegó. Este hook lo encapsula
 * para que los dos shells lo traten igual.
 *
 * `cargando` arranca en true y sólo baja cuando la petición termina — bien o mal.
 * Si termina mal, `config` queda en null: el llamador NO debe renderizar
 * MissionBriefing (que da por hecho un config), pero sí puede seguir mostrando el
 * lab, que es un HTML autónomo y no depende de la portada.
 */
import { useEffect, useState } from 'react';
import { cargaBriefing } from '@/data/briefingConfigs';
import type { BriefingConfig } from '@/components/MissionBriefing';

export function useBriefing(id: string, respaldoId?: string) {
  // El estado guarda DE QUÉ LAB es la portada, no sólo la portada. Con un
  // `config` suelto habría un fotograma malo al cambiar de lab: React renderiza
  // con el `id` nuevo ANTES de correr el efecto, así que el lab nuevo se pintaría
  // un instante con la portada del anterior (el shell no se desmonta al navegar
  // entre labs — de ahí el `key={simuladorId}` del <iframe>). Comparando el id
  // aquí, en el render, ese estado es inexpresable en vez de sólo improbable.
  const [resuelto, setResuelto] = useState<{ id: string; config: BriefingConfig | null } | null>(null);

  useEffect(() => {
    let vigente = true;
    cargaBriefing(id, respaldoId).then((config) => {
      if (vigente) setResuelto({ id, config });
    });
    return () => {
      vigente = false;
    };
  }, [id, respaldoId]);

  const alDia = resuelto?.id === id;
  return { config: alDia ? resuelto!.config : null, cargando: !alDia };
}
