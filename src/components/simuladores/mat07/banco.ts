'use client';
/**
 * mat07/banco.ts — estado LOCAL del banco óptico de Snell (fuera del store global,
 * que guarda sólo lo que juzga el reto: n₁, n₂, θ₁, la respuesta y el estado).
 *
 * Lo comparten el Piloto (controles y dock), la escena 3D y la bitácora, para que
 * los tres digan lo mismo: qué fuente está encendida, en qué sentido cruza la luz,
 * con qué polarización, y —el RELOJ ÚNICO— la fase φ del láser que la escena está
 * mostrando en este cuadro (`faseVis`). El dock lee `faseVis`, no el objetivo: si el
 * láser todavía está girando hacia el ángulo nuevo, R y T dicen lo que se ve.
 */
import { create } from 'zustand';
import type { IdLaser, Polarizacion, Sentido } from './optica';

export type Vista = 'tresCuartos' | 'cenital' | 'lupa';

export interface Medicion {
  id: number;
  sentido: Sentido;
  /** θ₁ puesto en el láser (°) */
  theta1: number;
  /** θ₂ que el alumno leyó en el disco (°) */
  leido: number;
  laser: IdLaser;
}

export interface EstadoBanco {
  laser: IdLaser;
  sentido: Sentido;
  pol: Polarizacion;
  vista: Vista;
  /** cambia en cada pulsación de una vista (permite repetir la misma) */
  vistaPulso: number;
  /** fase φ (°) que la escena está mostrando ahora mismo; null = sin escena */
  faseVis: number | null;
  mediciones: Medicion[];
  setLaser: (l: IdLaser) => void;
  setSentido: (s: Sentido) => void;
  setPol: (p: Polarizacion) => void;
  setVista: (v: Vista) => void;
  setFaseVis: (f: number | null) => void;
  anotar: (m: Omit<Medicion, 'id'>) => void;
  borrarMedicion: (id: number) => void;
  borrarMediciones: () => void;
  reiniciar: () => void;
}

const INICIAL = {
  laser: 'green' as IdLaser,
  sentido: 'aire-bloque' as Sentido,
  pol: 'natural' as Polarizacion,
  vista: 'tresCuartos' as Vista,
  vistaPulso: 0,
  faseVis: null as number | null,
  mediciones: [] as Medicion[],
};

let siguienteId = 1;

export const useBancoSnell = create<EstadoBanco>((set) => ({
  ...INICIAL,
  setLaser: (laser) => set({ laser }),
  setSentido: (sentido) => set({ sentido }),
  setPol: (pol) => set({ pol }),
  setVista: (vista) => set((s) => ({ vista, vistaPulso: s.vistaPulso + 1 })),
  setFaseVis: (faseVis) => set({ faseVis }),
  anotar: (m) => set((s) => ({ mediciones: [...s.mediciones, { ...m, id: siguienteId++ }] })),
  borrarMedicion: (id) => set((s) => ({ mediciones: s.mediciones.filter((m) => m.id !== id) })),
  borrarMediciones: () => set({ mediciones: [] }),
  reiniciar: () => set({ ...INICIAL }),
}));
