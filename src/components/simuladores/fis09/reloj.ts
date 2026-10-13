'use client';
/**
 * fis09/reloj.ts — EL reloj del banco de Coulomb (sin three).
 *
 * Es la única fuente de la que leen, en el mismo cuadro, la escena 3D (posición de la
 * esfera 2, líneas de campo, equipotenciales, flechas y cámara) y la gráfica F–r del dock
 * (su marcador). La escena lo hace avanzar en su `useFrame` (`paso(dt)`) y el dock se
 * redibuja desde la suscripción, así que nunca hay dos relojes.
 *
 *  · r visible: muelle críticamente amortiguado hacia la r pedida (ω = 12 s⁻¹, sin
 *    rebote): la esfera se desliza y el campo se deforma de forma continua.
 *  · Cargas: cambian de golpe (la siembra de Gauss depende de |q|: no hay «media
 *    línea»), pero las líneas vuelven a CRECER desde las cargas (`revelado`, 0→1 en ~1 s).
 *  · t: tiempo de animación de los trazos que recorren las líneas (sentido de E). Con
 *    pausa se congela; con «reducir movimiento» todo es instantáneo y arranca en pausa.
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';

export interface EstadoBanco { q1: number; q2: number; r: number }

export interface RelojCampo {
  /** lo pedido por los controles */
  readonly objetivo: EstadoBanco;
  /** lo que se ve: r interpolada y cargas vigentes */
  readonly vis: EstadoBanco;
  /** velocidad de r (cm/s), estado interno del muelle */
  vr: number;
  /** tiempo de animación (s) */
  t: number;
  /** crecimiento de las líneas tras un cambio de cargas (0 → 1) */
  revelado: number;
  pausa: boolean;
  reducido: boolean;
  /** sube cuando cambia la geometría del campo (r o q): la escena recalcula */
  versionCampo: number;
  /** sube en cada paso (para la gráfica) */
  version: number;
  /** hay una escena moviendo el reloj (si no, `fijar` salta al objetivo) */
  escenaActiva: boolean;
  fijar(e: EstadoBanco): void;
  paso(dt: number): void;
  suscribir(fn: () => void): () => void;
}

const OMEGA = 12;            // s⁻¹ (muelle crítico: a 0,5 s ya ha recorrido el 98 %)
const T_REVELADO = 1.1;      // s

export function crearRelojCampo(inicial: EstadoBanco, reducido: boolean): RelojCampo {
  const subs = new Set<() => void>();
  const avisar = () => { r.version++; subs.forEach((f) => f()); };
  const r: RelojCampo = {
    objetivo: { ...inicial },
    vis: { ...inicial },
    vr: 0,
    t: 0,
    revelado: reducido ? 1 : 0,
    pausa: reducido,
    reducido,
    versionCampo: 0,
    version: 0,
    escenaActiva: false,
    fijar(e) {
      const o = r.objetivo;
      const cambiaQ = e.q1 !== o.q1 || e.q2 !== o.q2;
      if (!cambiaQ && e.r === o.r) return;
      o.q1 = e.q1; o.q2 = e.q2; o.r = e.r;
      if (cambiaQ) {
        r.vis.q1 = e.q1; r.vis.q2 = e.q2;
        r.revelado = r.reducido ? 1 : 0;
        r.versionCampo++;
      }
      if (r.reducido || !r.escenaActiva) {
        if (r.vis.r !== e.r) { r.vis.r = e.r; r.vr = 0; r.versionCampo++; }
      }
      avisar();
    },
    paso(dt) {
      const h = Math.min(0.05, Math.max(0, dt));
      if (!r.pausa) r.t += h;
      const o = r.objetivo, v = r.vis;
      if (v.r !== o.r) {
        // muelle crítico integrado exacto en el paso (sin rebote ni inestabilidad)
        const x0 = v.r - o.r, v0 = r.vr;
        const e = Math.exp(-OMEGA * h);
        const x = (x0 + (v0 + OMEGA * x0) * h) * e;
        r.vr = (v0 - OMEGA * (v0 + OMEGA * x0) * h) * e;
        v.r = o.r + x;
        if (Math.abs(x) < 0.02 && Math.abs(r.vr) < 0.1) { v.r = o.r; r.vr = 0; }
        r.versionCampo++;
      }
      if (r.revelado < 1) r.revelado = Math.min(1, r.revelado + h / T_REVELADO);
      avisar();
    },
    suscribir(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
  };
  return r;
}

/** ¿El sistema pide reducir el movimiento? */
export function prefiereReducirMovimiento(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

/** Reloj ligado a los controles del banco: fija el objetivo cada vez que cambian. */
export function useRelojCampo(e: EstadoBanco, reducido: boolean): RelojCampo {
  const reloj = useMemo(() => crearRelojCampo(e, reducido), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reloj.fijar(e); }, [reloj, e.q1, e.q2, e.r]); // eslint-disable-line react-hooks/exhaustive-deps
  return reloj;
}

/** Re-renderiza con cada paso del reloj (sólo para piezas DOM baratas). */
export function useVersionReloj(reloj: RelojCampo): number {
  return useSyncExternalStore(reloj.suscribir, () => reloj.version, () => reloj.version);
}
