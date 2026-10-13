'use client';
/**
 * qmi01/reloj.ts — EL reloj del modelo cuántico (sin three).
 *
 * Al añadir o quitar un protón o un electrón, las Z_eff de Slater cambian de golpe;
 * la nube no debe saltar. Este reloj lleva la Z_eff INTERPOLADA de cada orbital
 * (aproximación exponencial, τ = 0,22 s) y es la única fuente de la que leen, en
 * el mismo cuadro, la escena 3D (escala de cada nube, contornos, cara de corte) y
 * la gráfica de densidad radial del panel. Los valores intermedios son sólo la
 * transición visual entre dos configuraciones: los números del diagrama de cajas
 * son los del estado final (estadoAtomo).
 *
 * Con «reducir movimiento» la transición es instantánea.
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { ORBITALES, type EstadoAtomo } from './orbitales';

export interface RelojAtomo {
  /** Z_eff interpolada por orbital, en el orden de ORBITALES */
  readonly zEff: Float64Array;
  /** Z_eff final (la del estado actual) */
  readonly objetivo: Float64Array;
  /** sube con cada cambio de zEff (para useSyncExternalStore) */
  version: number;
  fijar(objetivo: ArrayLike<number>, instantaneo: boolean): void;
  suscribir(fn: () => void): () => void;
  detener(): void;
}

const TAU = 0.22; // s

export function crearReloj(inicial: ArrayLike<number>): RelojAtomo {
  const zEff = Float64Array.from(inicial);
  const objetivo = Float64Array.from(inicial);
  const subs = new Set<() => void>();
  let raf = 0;
  let tPrev = 0;
  const avisar = () => { r.version++; subs.forEach((f) => f()); };
  const paso = (t: number) => {
    const dt = tPrev ? Math.min(0.1, (t - tPrev) / 1000) : 1 / 60;
    tPrev = t;
    const k = 1 - Math.exp(-dt / TAU);
    let activo = false;
    for (let i = 0; i < zEff.length; i++) {
      const d = objetivo[i] - zEff[i];
      if (Math.abs(d) < 2e-4) zEff[i] = objetivo[i];
      else { zEff[i] += d * k; activo = true; }
    }
    avisar();
    if (activo) raf = requestAnimationFrame(paso);
    else { raf = 0; tPrev = 0; }
  };
  const r: RelojAtomo = {
    zEff, objetivo, version: 0,
    fijar(obj, instantaneo) {
      let cambia = false;
      for (let i = 0; i < objetivo.length; i++) { if (objetivo[i] !== obj[i]) cambia = true; objetivo[i] = obj[i]; }
      if (!cambia) return;
      if (instantaneo || typeof requestAnimationFrame === 'undefined') {
        if (raf) cancelAnimationFrame(raf);
        raf = 0; tPrev = 0;
        zEff.set(objetivo);
        avisar();
        return;
      }
      if (!raf) { tPrev = 0; raf = requestAnimationFrame(paso); }
    },
    suscribir(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
    detener() { if (raf) cancelAnimationFrame(raf); raf = 0; },
  };
  return r;
}

/** Reloj ligado al estado del átomo: fija el objetivo cada vez que cambia. */
export function useRelojAtomo(estado: EstadoAtomo, instantaneo: boolean): RelojAtomo {
  const reloj = useMemo(() => crearReloj(estado.orbitales.map((o) => o.zEff)), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reloj.fijar(estado.orbitales.map((o) => o.zEff), instantaneo); }, [estado, instantaneo, reloj]);
  useEffect(() => () => reloj.detener(), [reloj]);
  return reloj;
}

/** Re-renderiza el componente con cada paso del reloj (para la gráfica DOM). */
export function useVersionReloj(reloj: RelojAtomo): number {
  return useSyncExternalStore(reloj.suscribir, () => reloj.version, () => reloj.version);
}

export const INDICE_ORBITAL = Object.fromEntries(ORBITALES.map((o, i) => [o.id, i])) as Record<string, number>;
