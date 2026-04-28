import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';

export const createBiologiaSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  microscopio: { muestra: 'vegetal', aumento: 1, iluminacion: 50, posicionX: 0, posicionY: 0, objetivo: "Cloroplasto", status: 'idle' },
  transporte: { concExt: 0.3, concInt: 0.3, tipoCelula: 'animal', verParticulas: true, volumen: 100, presionOsmotica: 7.4, history: [], status: 'idle' },
  sintesis: { fase: 'transcripcion', adnPlantilla: 'TACCAGGGTATT', arnMensajero: '', proteina: [], errores: 0, currentIndex: 0, lastAddedBase: null, isCorrect: null, status: 'idle' },
  fotosintesis: { distancia: 5, color: 'blanco', oxigenoAcumulado: 0, tiempo: 0, simulando: false, targetO2: 50, status: 'idle' },
  genetica: { padre1: 'AaBb', padre2: 'AaBb', poblacionF1: [], tamanioMuestra: 100, status: 'idle' },
  evolucion: { ambiente: 'limpio', generacion: 1, clara: 50, oscura: 50, cazadasClaras: 0, cazadasOscuras: 0, tiempo: 30, isRunning: false, historial: [], bugs: [] },
  sistemaNervioso: { fuerzaGolpe: 50, integridadMielina: 100, estado: 'reposo', latenciaMedida: 0, velocidadConduccion: 120, status: 'idle' },
  cardio: { ritmoBPM: 70, estadoFisiologico: 'Reposo', faseActual: 'Diástole', targetBPM: 145, status: 'idle' },
  digestion: { macronutriente: 'proteina', enzimaSeleccionada: null, nivelPH: 7.0, estado: 'intacto', monomerosAbsorbidos: 0, status: 'idle' },
  ecosistema: { poblacionPresas: 100, poblacionDepredadores: 20, alfa: 1.1, beta: 0.1, gamma: 0.4, delta: 0.05, tiempoVirtual: 0, historial: [], simulando: false, status: 'idle' },

  setMicroscopio: (data: Partial<SimuladorState['microscopio']>) => set((state) => ({ microscopio: { ...state.microscopio, ...data } })),
  generarSemillaB1: () => set((state) => {
    const objetivos = [
      { muestra: 'vegetal', obj: 'Cloroplasto', minMag: 2000 },
      { muestra: 'animal', obj: 'Núcleo', minMag: 400 },
      { muestra: 'vegetal', obj: 'Pared Celular', minMag: 100 },
      { muestra: 'animal', obj: 'Mitocondria', minMag: 5000 }
    ];
    const res = objetivos[Math.floor(Math.random() * objetivos.length)];
    return { 
      microscopio: { ...state.microscopio, muestra: res.muestra as any, objetivo: res.obj, status: 'idle', aumento: 1, posicionX: 0, posicionY: 0 },
      bitacoraData: { ...state.bitacoraData, objB1: res.obj, magMin: res.minMag }
    };
  }),
  validarB1: () => {
    const { microscopio, bitacoraData } = get();
    const isMagOk = microscopio.aumento >= (bitacoraData.magMin || 1000);
    const isLightOk = microscopio.iluminacion >= 60 && microscopio.iluminacion <= 95;
    const isOk = isMagOk && isLightOk;
    set((state) => ({ microscopio: { ...state.microscopio, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetB1: () => set((state) => ({ microscopio: { ...state.microscopio, aumento: 1, iluminacion: 50, posicionX: 0, posicionY: 0, status: 'idle' } })),
  setTransporte: (data: Partial<SimuladorState['transporte']>) => set((state) => ({ transporte: { ...state.transporte, ...data } })),
  tickTransporte: (dt: number) => set((state) => {
    const { concExt, concInt, volumen, history } = state.transporte;
    const diff = concInt - concExt;
    const targetVol = 100 + (diff * 200);
    const step = (targetVol - volumen) * dt * 0.5;
    const newVol = Math.max(50, Math.min(180, volumen + step));
    const newHistory = [...history, { time: history.length, volumen: newVol }].slice(-50);
    return { transporte: { ...state.transporte, volumen: newVol, history: newHistory } };
  }),
  generarSemillaB2: () => set((state) => ({ transporte: { ...state.transporte, concInt: 0.1 + Math.random() * 0.6, concExt: 0.3, volumen: 100, history: [], status: 'idle' } })),
  validarB2: () => {
    const isOk = Math.abs(get().transporte.concExt - get().transporte.concInt) < 0.05;
    set((state) => ({ transporte: { ...state.transporte, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetB2: () => set((state) => ({ transporte: { ...state.transporte, concExt: 0.3, volumen: 100, history: [], status: 'idle' } })),
  addNucleotido: (base: string) => set((state) => {
    const pairing: Record<string, string> = { 'A': 'U', 'T': 'A', 'C': 'G', 'G': 'C' };
    const target = pairing[state.sintesis.adnPlantilla[state.sintesis.currentIndex]];
    if (base === target) {
      const isDone = state.sintesis.arnMensajero.length + 1 === state.sintesis.adnPlantilla.length;
      return { sintesis: { ...state.sintesis, arnMensajero: state.sintesis.arnMensajero + base, currentIndex: isDone ? 0 : state.sintesis.currentIndex + 1, fase: isDone ? 'traduccion' : 'transcripcion' } };
    }
    return { sintesis: { ...state.sintesis, errores: state.sintesis.errores + 1 } };
  }),
  advanceRibosoma: () => set((state) => {
    const { arnMensajero, currentIndex, proteina } = state.sintesis;
    const codon = arnMensajero.slice(currentIndex, currentIndex + 3);
    if (codon === 'UAA' || codon === 'UAG' || codon === 'UGA') return { sintesis: { ...state.sintesis, status: 'success' } };
    return { sintesis: { ...state.sintesis, proteina: [...proteina, { name: 'AA', color: '#3B82F6' }], currentIndex: currentIndex + 3 } };
  }),
  generarSemillaB3: () => set((state) => ({ sintesis: { ...state.sintesis, adnPlantilla: 'TACCAGGGTATT', arnMensajero: '', proteina: [], errores: 0, currentIndex: 0, fase: 'transcripcion', status: 'idle' } })),
  resetB3: () => get().generarSemillaB3(),
  setFotosintesis: (data: Partial<SimuladorState['fotosintesis']>) => set((state) => ({ fotosintesis: { ...state.fotosintesis, ...data } })),
  tickFotosintesis: (dt: number) => set((state) => {
    if (!state.fotosintesis.simulando) return state;
    const intensity = 100 / (state.fotosintesis.distancia * state.fotosintesis.distancia);
    const newO2 = Math.min(state.fotosintesis.targetO2, state.fotosintesis.oxigenoAcumulado + intensity * dt * 0.1);
    return { fotosintesis: { ...state.fotosintesis, oxigenoAcumulado: newO2, status: newO2 >= state.fotosintesis.targetO2 ? 'success' : 'idle' } };
  }),
  generarSemillaB4: () => set((state) => ({ fotosintesis: { ...state.fotosintesis, oxigenoAcumulado: 0, targetO2: 50, status: 'idle' } })),
  resetB4: () => get().generarSemillaB4(),
  setGenetica: (data: Partial<SimuladorState['genetica']>) => set((state) => ({ genetica: { ...state.genetica, ...data } })),
  generarF1: () => set((state) => ({ genetica: { ...state.genetica, status: 'success' } })),
  resetB5: () => set((state) => ({ genetica: { ...state.genetica, poblacionF1: [], status: 'idle' } })),
  setEvolucion: (data: Partial<SimuladorState['evolucion']>) => set((state) => ({ evolucion: { ...state.evolucion, ...data } })),
  tickEvolucion: (dt: number) => set((state) => {
    if (!state.evolucion.isRunning) return state;
    const newTime = Math.max(0, state.evolucion.tiempo - dt);
    return { evolucion: { ...state.evolucion, tiempo: newTime, isRunning: newTime > 0 } };
  }),
  cazarPolilla: (id: number) => set((state) => ({ evolucion: { ...state.evolucion, cazadasClaras: state.evolucion.cazadasClaras + 1 } })),
  finalizarGeneracion: () => set((state) => ({ evolucion: { ...state.evolucion, generacion: state.evolucion.generacion + 1 } })),
  resetB6: () => set((state) => ({ evolucion: { ...state.evolucion, generacion: 1, clara: 50, oscura: 50, isRunning: false } })),
  setB7State: (data: Partial<SimuladorState['sistemaNervioso']>) => set((state) => ({ sistemaNervioso: { ...state.sistemaNervioso, ...data } })),
  dispararReflejo: () => set((state) => ({ sistemaNervioso: { ...state.sistemaNervioso, status: 'success' } })),
  generarSemillaB7: () => set((state) => ({ sistemaNervioso: { ...state.sistemaNervioso, integridadMielina: 60 + Math.random() * 40 } })),
  resetB7: () => set((state) => ({ sistemaNervioso: { ...state.sistemaNervioso, status: 'idle', estado: 'reposo' } })),
  setCardio: (data: Partial<SimuladorState['cardio']>) => set((state) => ({ cardio: { ...state.cardio, ...data } })),
  generarSemillaB8: () => set((state) => ({ cardio: { ...state.cardio, targetBPM: 120 + Math.random() * 40 } })),
  resetB8: () => set((state) => ({ cardio: { ...state.cardio, ritmoBPM: 70, status: 'idle' } })),
  setDigestion: (data: Partial<SimuladorState['digestion']>) => set((state) => ({ digestion: { ...state.digestion, ...data } })),
  generarSemillaB9: () => set((state) => ({ digestion: { ...state.digestion, macronutriente: 'proteina' } })),
  resetB9: () => set((state) => ({ digestion: { ...state.digestion, status: 'idle' } })),
  setEcosistema: (data: Partial<SimuladorState['ecosistema']>) => set((state) => ({ ecosistema: { ...state.ecosistema, ...data } })),
  tickEcosistema: (dt: number) => set((state) => {
    if (!state.ecosistema.simulando) return state;
    const newX = state.ecosistema.poblacionPresas * (1 + dt * 0.1);
    return { ecosistema: { ...state.ecosistema, poblacionPresas: newX } };
  }),
  generarSemillaB10: () => set((state) => ({ ecosistema: { ...state.ecosistema, poblacionPresas: 100, poblacionDepredadores: 20 } })),
  resetB10: () => set((state) => ({ ecosistema: { ...state.ecosistema, simulando: false, status: 'idle' } })),
});
