"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Cronómetro manual para los labs de oscilaciones. El tiempo se mide con
 * performance.now() y el display se refresca a 20 Hz SOLO mientras corre
 * (antes era un setState por frame que re-renderizaba todo el panel).
 */
export function useCronometro() {
  const [corriendo, setCorriendo] = useState(false);
  const [ms, setMs] = useState(0);
  const inicio = useRef(0);
  const acumulado = useRef(0);

  useEffect(() => {
    if (!corriendo) return;
    const id = window.setInterval(() => setMs(acumulado.current + performance.now() - inicio.current), 50);
    return () => window.clearInterval(id);
  }, [corriendo]);

  const alternar = useCallback(() => {
    if (corriendo) {
      acumulado.current += performance.now() - inicio.current;
      setMs(acumulado.current);
      setCorriendo(false);
    } else {
      inicio.current = performance.now();
      setCorriendo(true);
    }
  }, [corriendo]);

  const reiniciar = useCallback(() => { acumulado.current = 0; setMs(0); setCorriendo(false); }, []);

  return { corriendo, ms, alternar, reiniciar };
}

export const formatoCrono = (ms: number) => {
  const s = Math.max(0, ms) / 1000;
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}.${Math.floor((Math.max(0, ms) % 1000) / 10).toString().padStart(2, '0')}`;
};
