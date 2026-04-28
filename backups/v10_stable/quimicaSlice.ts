import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';

export const createQuimicaSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  particulas: { protones: 0, neutrones: 0, electrones: 0, isStable: true, message: "" },
  gases: { T: 300, V: 10, P: 1.0, pTarget: 3.5, isExploded: false },
  balanceo: { coeficientes: [1, 1, 1, 1], isBalanced: false },
  limitante: { mN2: 28, mH2: 6, limitanteReal: "", excesoReal: 0, isRunning: false, status: 'idle' },
  soluciones: { 
    mTarget: 0.5, vTarget: 250, mRequerida: 7.3, 
    balanza: { polvo: 0, tara: false, encendida: true }, 
    matraz: { polvo: 0, agua: 0 }, 
    status: 'idle' 
  },
  solubilidad: { temp: 20, salAgregada: 0, ubicacion: 'mesa', status: 'idle' },
  titulacion: { ca: 0.1, va: 25, cb: 0.1, volumenBase: 0, purgada: false, indicador: false, status: 'idle', history: [] },
  equilibrio: { jeringas: [], status: 'idle' },
  celda: { vasoIzq: null, vasoDer: null, puenteSalino: false, cablesConectados: false, status: 'idle', seedMetales: [], voltaje: 0 },
  destilacion: { calorManta: 20, tempMezcla: 20, volEtanolMatraz: 100, volAguaMatraz: 100, volDestilado: 0, purezaDestilado: 0, status: 'idle' },

  setParticulas: (p: number, n: number, e: number) => set((state) => ({ 
    particulas: { ...state.particulas, protones: Math.max(0, p), neutrones: Math.max(0, n), electrones: Math.max(0, e) } 
  })),
  validarEstructura: () => {
    const { protones, neutrones, electrones } = get().particulas;
    // Reto Dinámico: El primer reto suele ser Carbono-14
    const isC14 = protones === 6 && (protones + neutrones) === 14 && (protones - electrones) === 0;
    
    if (isC14) {
      set((state) => ({ 
        particulas: { ...state.particulas, message: "¡Perfecto! Has construido un isótopo estable de Carbono-14." }
      }));
    } else {
      set((state) => ({ 
        particulas: { ...state.particulas, message: "Estructura atómica inestable o no coincide con el objetivo." }
      }));
    }
    return isC14;
  },
  updateGases: (t: number, v: number) => set((state) => ({ 
    gases: { ...state.gases, T: t, V: v, P: parseFloat((t / (30 * v)).toFixed(2)), isExploded: (t / (30 * v)) > 5.0 } 
  })),
  resetGases: () => set((state) => ({ gases: { ...state.gases, T: 300, V: 10, P: 1.0, isExploded: false } })),
  generarSemillaGases: () => set((state) => ({ gases: { ...state.gases, pTarget: parseFloat((1.5 + Math.random() * 2.5).toFixed(1)) } })),
  setCoeficiente: (index: number, value: number) => set((state) => {
    const c = [...state.balanceo.coeficientes];
    c[index] = Math.max(1, value);
    return { balanceo: { ...state.balanceo, coeficientes: c } };
  }),
  resetBalanceo: () => set((state) => ({ balanceo: { ...state.balanceo, coeficientes: [1, 1, 1, 1], isBalanced: false } })),
  generarSemillaP4: () => set((state) => {
    const mN = 10 + Math.floor(Math.random() * 40), mH = 5 + Math.floor(Math.random() * 15);
    const nN = mN / 28, nH = mH / 2;
    let lR = "", eR = 0;
    if (nN * 3 > nH) { lR = "H2"; eR = Math.round((mN - (nH / 3 * 28)) * 10) / 10; }
    else { lR = "N2"; eR = Math.round((mH - (nN * 3 * 2)) * 10) / 10; }
    return { limitante: { ...state.limitante, mN2: mN, mH2: mH, limitanteReal: lR, excesoReal: eR, status: 'idle' } };
  }),
  validarP4: (ansLimitante: string, ansExceso: number) => {
    const { limitanteReal, excesoReal } = get().limitante;
    const isOk = (ansLimitante.toLowerCase() === limitanteReal.toLowerCase()) && (Math.abs(ansExceso - excesoReal) < 0.1);
    set((state) => ({ limitante: { ...state.limitante, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP4: () => set((state) => ({ limitante: { ...state.limitante, isRunning: false, status: 'idle' } })),
  generarSemillaP5: () => set((state) => {
    const mTarget = parseFloat((0.1 + Math.random() * 0.9).toFixed(2)), vTarget = [100, 250, 500][Math.floor(Math.random() * 3)];
    const mRequerida = parseFloat((mTarget * (vTarget / 1000) * 58.44).toFixed(2));
    return { soluciones: { ...state.soluciones, mTarget, vTarget, mRequerida, status: 'idle' }, bitacoraData: { ...state.bitacoraData, mTarget, vTarget, mReq: mRequerida } };
  }),
  addPolvo: (amount: number) => set((state) => {
    if (!state.soluciones.balanza.encendida) return state;
    return { soluciones: { ...state.soluciones, balanza: { ...state.soluciones.balanza, polvo: state.soluciones.balanza.polvo + amount } } };
  }),
  toggleTara: () => set((state) => ({ soluciones: { ...state.soluciones, balanza: { ...state.soluciones.balanza, tara: !state.soluciones.balanza.tara } } })),
  transferirPolvo: () => set((state) => ({ soluciones: { ...state.soluciones, matraz: { ...state.soluciones.matraz, polvo: state.soluciones.balanza.polvo }, balanza: { ...state.soluciones.balanza, polvo: 0 }, status: 'transferred' } })),
  setAgua: (amount: number) => set((state) => ({ soluciones: { ...state.soluciones, matraz: { ...state.soluciones.matraz, agua: amount } } })),
  validarP5: () => {
    const { soluciones } = get();
    const mActual = (soluciones.matraz.polvo / 58.44) / (soluciones.matraz.agua / 1000);
    const isOk = Math.abs(mActual - soluciones.mTarget) < 0.05;
    set((state) => ({ soluciones: { ...state.soluciones, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP5: () => set((state) => ({ soluciones: { ...state.soluciones, matraz: { polvo: 0, agua: 0 }, status: 'idle' } })),
  setUbicacionVaso: (loc: 'mesa' | 'parrilla' | 'hielo') => set((state) => ({ solubilidad: { ...state.solubilidad, ubicacion: loc } })),
  addSalKNO3: (amount: number) => set((state) => ({ solubilidad: { ...state.solubilidad, salAgregada: state.solubilidad.salAgregada + amount } })),
  updateTemperaturaP6: (dt: number) => set((state) => {
    let newTemp = state.solubilidad.temp;
    if (state.solubilidad.ubicacion === 'parrilla') newTemp = Math.min(100, newTemp + dt);
    else if (state.solubilidad.ubicacion === 'hielo') newTemp = Math.max(0, newTemp - dt * 2.5);
    return { solubilidad: { ...state.solubilidad, temp: newTemp } };
  }),
  validarP6: () => {
    const { temp, salAgregada } = get().solubilidad;
    const solubility = 31.6 * Math.exp(0.02 * temp);
    const isOk = salAgregada >= solubility * 0.9 && salAgregada <= solubility * 1.1;
    set((state) => ({ solubilidad: { ...state.solubilidad, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP6: () => set((state) => ({ solubilidad: { temp: 20, salAgregada: 0, ubicacion: 'mesa', status: 'idle' } })),
  generarSemillaP7: () => set((state) => {
    const ca = parseFloat((0.05 + Math.random() * 0.15).toFixed(3)), cb = 0.1, va = 25;
    return { titulacion: { ...state.titulacion, ca, cb, va, volumenBase: 0, status: 'idle', history: [] } };
  }),
  addDropNaOH: (amount: number) => set((state) => {
    const newVol = state.titulacion.volumenBase + amount;
    const ph = 7 + (newVol / state.titulacion.cb);
    return { titulacion: { ...state.titulacion, volumenBase: newVol, history: [...state.titulacion.history, { vol: newVol, ph }].slice(-50) } };
  }),
  toggleIndicadorP7: () => set((state) => ({ titulacion: { ...state.titulacion, indicador: !state.titulacion.indicador } })),
  togglePurgaP7: () => set((state) => ({ titulacion: { ...state.titulacion, purgada: !state.titulacion.purgada } })),
  validarP7: (ansCa: number) => {
    const isOk = Math.abs(ansCa - get().titulacion.ca) < 0.01;
    set((state) => ({ titulacion: { ...state.titulacion, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP7: () => set((state) => ({ titulacion: { ...state.titulacion, volumenBase: 0, status: 'idle', history: [] } })),
  setUbicacionJeringa: (id: number, loc: 'mesa' | 'caliente' | 'hielo') => set((state) => ({
    equilibrio: { ...state.equilibrio, jeringas: state.equilibrio.jeringas.map(j => j.id === id ? { ...j, ubicacion: loc } : j) }
  })),
  updateTemperaturaP8: (dt: number) => set((state) => ({
    equilibrio: { 
      ...state.equilibrio, 
      jeringas: state.equilibrio.jeringas.map(j => {
        const targets: Record<string, number> = { mesa: 20, caliente: 80, hielo: 0 };
        const target = targets[j.ubicacion];
        const step = (target - j.temp) * dt * 0.2;
        return { ...j, temp: j.temp + step };
      })
    }
  })),
  validarP8: (d1: string, d2: string, d3: string) => {
    const { jeringas } = get().equilibrio;
    const tHielo = jeringas.find(j => j.id === 3)?.temp || 20;
    const isOk = tHielo < 10 && d1 === 'transparente' && d2 === 'cafe' && d3 === 'incoloro';
    set((state) => ({ equilibrio: { ...state.equilibrio, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP8: () => set((state) => ({ equilibrio: { jeringas: [{ id: 1, ubicacion: 'mesa', temp: 20 }, { id: 2, ubicacion: 'mesa', temp: 20 }, { id: 3, ubicacion: 'mesa', temp: 20 }], status: 'idle' } })),
  autoResolveP8: () => {},
  generarSemillaP9: () => set((state) => {
    const metals = ['Zn', 'Cu', 'Ag', 'Mg'], shuffled = [...metals].sort(() => Math.random() - 0.5);
    return { celda: { ...state.celda, seedMetales: shuffled.slice(0, 2), vasoIzq: null, vasoDer: null, status: 'idle', puenteSalino: false, cablesConectados: false, voltaje: 0 } };
  }),
  setMetalVaso: (vaso: 'izq' | 'der', metal: string | null) => set((state) => ({ celda: { ...state.celda, [vaso === 'izq' ? 'vasoIzq' : 'vasoDer']: metal } })),
  togglePuenteSalino: () => set((state) => ({ celda: { ...state.celda, puenteSalino: !state.celda.puenteSalino } })),
  toggleCables: () => set((state) => ({ celda: { ...state.celda, cablesConectados: !state.celda.cablesConectados } })),
  validarP9: (anodo: string, catodo: string, v: number) => {
    const { seedMetales, vasoIzq, vasoDer, puenteSalino, cablesConectados } = get().celda;
    const isOk = puenteSalino && cablesConectados && vasoIzq === seedMetales[0] && vasoDer === seedMetales[1] && Math.abs(v - 1.1) < 0.1;
    set((state) => ({ celda: { ...state.celda, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP9: () => set((state) => ({ celda: { ...state.celda, vasoIzq: null, vasoDer: null, puenteSalino: false, cablesConectados: false, status: 'idle', voltaje: 0 } })),
  setCalorManta: (temp: number) => set((state) => ({ destilacion: { ...state.destilacion, calorManta: temp } })),
  updateDestilacion: (dt: number) => set((state) => {
    const d = state.destilacion;
    const diff = d.calorManta - d.tempMezcla, step = diff * dt * 0.05;
    const newTemp = d.tempMezcla + step, isBoiling = newTemp > 78;
    return { destilacion: { ...d, tempMezcla: newTemp, status: isBoiling ? 'boiling' : 'idle' } };
  }),
  validarP10: () => {
    const isOk = get().destilacion.volDestilado > 50;
    set((state) => ({ destilacion: { ...state.destilacion, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP10: () => set((state) => ({ destilacion: { calorManta: 20, tempMezcla: 20, volEtanolMatraz: 100, volAguaMatraz: 100, volDestilado: 0, purezaDestilado: 0, status: 'idle' } })),
});
