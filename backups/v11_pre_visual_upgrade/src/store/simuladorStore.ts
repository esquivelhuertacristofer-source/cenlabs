import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimuladorState } from './types';
import { createCoreSlice } from './slices/coreSlice';
import { createQuimicaSlice } from './slices/quimicaSlice';
import { createFisicaSlice } from './slices/fisicaSlice';
import { createBiologiaSlice } from './slices/biologiaSlice';
import { createMatematicasSlice } from './slices/matematicasSlice';

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
      name: 'cen-sim-v9',
      partialize: (state: any) => ({ 
        timer: state.timer, 
        bitacoraData: state.bitacoraData, 
        pasoActual: state.pasoActual,
        particulas: state.particulas, 
        gases: state.gases, 
        balanceo: state.balanceo,
        limitante: state.limitante, 
        soluciones: state.soluciones, 
        solubilidad: state.solubilidad, 
        titulacion: state.titulacion, 
        equilibrio: state.equilibrio, 
        celda: state.celda, 
        destilacion: state.destilacion, 
        cuadraticas: state.cuadraticas, 
        sistemas2x2: state.sistemas2x2, 
        richter: state.richter, 
        pitagoras: state.pitagoras, 
        trigonometria: state.trigonometria, 
        geometria6: state.geometria6, 
        optica7: state.optica7, 
        derivada8: state.derivada8, 
        integral9: state.integral9, 
        galton10: state.galton10,
        tiro1: state.tiro1, // Fix: Persistir estado de balística (FIS-01)
        microscopio: state.microscopio, 
        transporte: state.transporte, 
        sintesis: state.sintesis, 
        fotosintesis: state.fotosintesis, 
        genetica: state.genetica, 
        evolucion: state.evolucion
      }),
    }
  )
);
