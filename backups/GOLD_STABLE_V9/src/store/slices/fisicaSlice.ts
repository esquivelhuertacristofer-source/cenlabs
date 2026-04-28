import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';

export const createFisicaSlice: StateCreator<SimuladorState, [], [], any> = (set) => ({
  plano2: { angulo: 30, coefRozamiento: 0.3, friccion: 0.1, masa: 5, animando: false, resultado: null },
  pendulo3: { longitud: 1.5, masa: 2.0, anguloInicial: 45, animando: false, periodo: 0, oscilando: false, resultado: null },
  hooke4: { k: 100, masa: 2.0, estiramiento: 0, amplitud: 0.5, oscilando: false, animando: false, t: 0, resultado: null },
  colisiones5: { m1: 2, v1: 5, m2: 2, v2: 0, tipo: 'elastica', animando: false, phase: 'idle', resultado: null },
  arquimedes6: { fluido: 'agua', densidadCuerpo: 800, volumenCuerpo: 0.001, sumergido: 0, resultado: null },
  dilatacion7: { material: 'hierro', tempIni: 20, tempFin: 100, longitud: 1.0, resultado: null },
  leyOhm8: { voltaje: 12, resistencia: 100, modo: 'serie', resultado: null },
  ohm8: { voltaje: 5, resistencia: 220, switchOn: false, ledRoto: false },
  electrostatica9: { q1: 1e-6, q2: 1e-6, distancia: 0.1, resultado: null },
  motor10: { imanIzq: 'N', imanDer: 'S', voltaje: 0, espiras: 10, interruptor: false, carga: 5, rpm: 0, encendido: false, resultado: null },
  tiro1: { angulo: 45, velocidad: 25, disparando: false },

  setPlano2: (data: Partial<SimuladorState['plano2']>) => set((state) => ({ plano2: { ...state.plano2, ...data } })),
  setPendulo3: (data: Partial<SimuladorState['pendulo3']>) => set((state) => ({ pendulo3: { ...state.pendulo3, ...data } })),
  setHooke4: (data: Partial<SimuladorState['hooke4']>) => set((state) => ({ hooke4: { ...state.hooke4, ...data } })),
  setColisiones5: (data: Partial<SimuladorState['colisiones5']>) => set((state) => ({ colisiones5: { ...state.colisiones5, ...data } })),
  setArquimedes6: (data: Partial<SimuladorState['arquimedes6']>) => set((state) => ({ arquimedes6: { ...state.arquimedes6, ...data } })),
  setDilatacion7: (data: Partial<SimuladorState['dilatacion7']>) => set((state) => ({ dilatacion7: { ...state.dilatacion7, ...data } })),
  setLeyOhm8: (data: Partial<SimuladorState['leyOhm8']>) => set((state) => ({ leyOhm8: { ...state.leyOhm8, ...data } })),
  setOhm8: (data: Partial<SimuladorState['ohm8']>) => set((state) => ({ ohm8: { ...state.ohm8, ...data } })),
  setElectrostatica9: (data: Partial<SimuladorState['electrostatica9']>) => set((state) => ({ electrostatica9: { ...state.electrostatica9, ...data } })),
  setMotor10: (data: Partial<SimuladorState['motor10']>) => set((state) => ({ motor10: { ...state.motor10, ...data } })),
  setTiro1: (data: Partial<SimuladorState['tiro1']>) => set((state) => ({ tiro1: { ...state.tiro1, ...data } })),
});
