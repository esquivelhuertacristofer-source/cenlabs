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
      partialize: (state: any) => {
        // Slice off fields that must NOT be persisted:
        //   - reacciones/sustancias: large constant arrays already in slice code
        //   - history/historial/bugs: ephemeral display-only data
        //   - capturas: transient lab screenshots
        //   - hallazgos (cuadraticas): exploration log, not needed on reload
        //   - bolitasPendientes: animation counter, always reset to 0
        // The deepMergeState function above ensures these fields are always
        // filled from the initial slice state after rehydration.
        const { reacciones: _br, ...balanceoSlim }      = state.balanceo;
        const { reacciones: _lr, ...limitanteSlim }     = state.limitante;
        const { sustancias: _ss, ...solubilidadSlim }   = state.solubilidad;
        const { history:    _th, ...titulacionSlim }    = state.titulacion;
        const { history:    _trh, ...transporteSlim }   = state.transporte;
        const { historial:  _evoh, bugs: _bug, ...evolucionSlim }  = state.evolucion;
        const { historial:  _ecoh, ...ecosistemaSlim }  = state.ecosistema;
        const { capturas:   _cap, ...microscopioSlim }  = state.microscopio;
        const { hallazgos:  _cuh, ...cuadraticasSlim }  = state.cuadraticas;
        const { bolitasPendientes: _bp, ...galton10Slim } = state.galton10;

        return {
          // Core
          bitacoraData: state.bitacoraData,
          pasoActual:   state.pasoActual,
          score:        state.score,

          // Química
          particulas:   state.particulas,
          gases:        state.gases,
          balanceo:     balanceoSlim,
          limitante:    limitanteSlim,
          soluciones:   state.soluciones,
          solubilidad:  solubilidadSlim,
          titulacion:   titulacionSlim,
          equilibrio:   state.equilibrio,
          celda:        state.celda,
          destilacion:  state.destilacion,

          // Física
          tiro1:          state.tiro1,
          plano2:         state.plano2,
          pendulo3:       state.pendulo3,
          hooke4:         state.hooke4,
          prensa5:        state.prensa5,
          arquimedes6:    state.arquimedes6,
          dilatacion7:    state.dilatacion7,
          ohm8:           state.ohm8,
          electrostatica9: state.electrostatica9,
          motor10:        state.motor10,

          // Matemáticas
          cuadraticas:   cuadraticasSlim,
          sistemas2x2:   state.sistemas2x2,
          richter:       state.richter,
          pitagoras:     state.pitagoras,
          trigonometria: state.trigonometria,
          geometria6:    state.geometria6,
          optica7:       state.optica7,
          derivada8:     state.derivada8,
          integral9:     state.integral9,
          galton10:      galton10Slim,

          // Biología
          microscopio:     microscopioSlim,
          transporte:      transporteSlim,
          sintesis:        state.sintesis,
          fotosintesis:    state.fotosintesis,
          genetica:        state.genetica,
          evolucion:       evolucionSlim,
          sistemaNervioso: state.sistemaNervioso,
          cardio:          state.cardio,
          digestion:       state.digestion,
          ecosistema:      ecosistemaSlim,
        };
      },
    }
  )
);
