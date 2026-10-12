import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimuladorState } from './types';
import { createCoreSlice } from './slices/coreSlice';
import { createQuimicaSlice } from './slices/quimicaSlice';
import { createFisicaSlice } from './slices/fisicaSlice';
import { createBiologiaSlice } from './slices/biologiaSlice';
import { createMatematicasSlice } from './slices/matematicasSlice';

// Deep-merge persisted sub-objects with the current initial state so that
// fields intentionally excluded from partialize (constants, ephemeral arrays)
// are always populated from the slice's initial values on rehydration.
function deepMergeState(persisted: unknown, current: SimuladorState): SimuladorState {
  const p = (persisted ?? {}) as Record<string, unknown>;
  const c = current as unknown as Record<string, unknown>;
  const result: Record<string, unknown> = { ...c };
  for (const key of Object.keys(p)) {
    const pVal = p[key];
    const cVal = c[key];
    if (
      pVal !== null && pVal !== undefined &&
      typeof pVal === 'object' && !Array.isArray(pVal) &&
      typeof cVal === 'object' && cVal !== null && !Array.isArray(cVal)
    ) {
      // Per-object deep merge: persisted fields overwrite initial, missing
      // fields (e.g. reacciones constants) come from the initial state.
      result[key] = { ...(cVal as object), ...(pVal as object) };
    } else {
      result[key] = pVal;
    }
  }
  return result as unknown as SimuladorState;
}

export const useSimuladorStore = create<SimuladorState>()(
  persist(
    (set, get, api) => ({
      ...createCoreSlice(set, get, api),
      ...createQuimicaSlice(set, get, api),
      ...createFisicaSlice(set, get, api),
      ...createBiologiaSlice(set, get, api),
      ...createMatematicasSlice(set, get, api),
    }),
    {
      name: 'cen-sim-v10',
      merge: deepMergeState,
      // Solo se guarda la bitácora (notas y ensayos del alumno, etiquetada con su
      // `labId`). El estado de cada lab NO se persiste: `entrarLab` lo reinicia en
      // cada apertura, y guardarlo solo servía para que un éxito viejo reabriera
      // el overlay de «misión cumplida», para aprobar editando localStorage y
      // para serializar todo el store en cada tick de animación.
      partialize: (state: SimuladorState) => ({
        bitacoraData: state.bitacoraData,
        pasoActual:   state.pasoActual,
        score:        state.score,
      }),
    }
  )
);
