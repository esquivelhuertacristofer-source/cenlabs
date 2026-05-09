import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';

export const createBiologiaSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  microscopio: { 
    muestra: 'vegetal', 
    objetivoMag: 4, 
    enfoqueZ: 0, 
    focoIdealZ: 50, 
    iluminacion: 50, 
    diafragmaIris: 100,
    aceiteInmersionAplicado: false,
    posicionX: 0, 
    posicionY: 0, 
    targetOrganelle: "Cloroplasto", 
    capturas: [],
    magnificacionVerified: false,
    abbeVerified: false,
    status: 'idle' 
  },
  transporte: { 
    concExt: 0.3, 
    concInt: 0.3, 
    glucosaExt: 0.0,
    temperatura: 25,
    tipoCelula: 'animal', 
    verParticulas: true, 
    volumen: 100, 
    presionOsmotica: 7.4, 
    history: [], 
    status: 'idle' 
  },
  sintesis: { fase: 'transcripcion', adnPlantilla: 'TACCAGGGTTACATT', arnMensajero: '', proteina: [], errores: 0, currentIndex: 0, lastAddedBase: null, isCorrect: null, status: 'idle' },
  fotosintesis: { 
    escenario: 'optimizacion_espectro',
    distancia: 5, 
    color: 'blanco', 
    oxigenoAcumulado: 0, 
    tiempo: 0, 
    simulando: false, 
    targetO2: 50, 
    status: 'idle' 
  },
  genetica: { padre1: 'AaBb', padre2: 'AaBb', poblacionF1: [], tamanioMuestra: 100, status: 'idle' },
  evolucion: { ambiente: 'limpio', generacion: 1, clara: 50, oscura: 50, cazadasClaras: 0, cazadasOscuras: 0, tiempo: 30, isRunning: false, historial: [], bugs: [] },
  sistemaNervioso: { fuerzaGolpe: 50, integridadMielina: 100, estado: 'reposo', latenciaMedida: 0, velocidadConduccion: 120, status: 'idle' },
  cardio: { ritmoBPM: 70, estadoFisiologico: 'Reposo', faseActual: 'Diástole', targetBPM: 145, status: 'idle' },
  digestion: { macronutriente: 'proteina', enzimaSeleccionada: null, nivelPH: 7.0, estado: 'intacto', monomerosAbsorbidos: 0, status: 'idle' },
  ecosistema: { poblacionPresas: 100, poblacionDepredadores: 20, alfa: 1.1, beta: 0.1, gamma: 0.4, delta: 0.05, tiempoVirtual: 0, historial: [], simulando: false, status: 'idle' },

  setMicroscopio: (data: Partial<SimuladorState['microscopio']>) => set((state) => ({ microscopio: { ...state.microscopio, ...data } })),
  generarSemillaB1: () => set((state) => {
    const objetivos = [
      { muestra: 'vegetal', obj: 'Cloroplasto', minMag: 40 }, // 40x obj * 10x ocular = 400x total
      { muestra: 'animal', obj: 'Núcleo', minMag: 40 },
      { muestra: 'vegetal', obj: 'Pared Celular', minMag: 10 },
      { muestra: 'animal', obj: 'Mitocondria', minMag: 100 },
      { muestra: 'bacteria', obj: 'Pared Bacteriana', minMag: 100 },
      { muestra: 'nervioso', obj: 'Soma Neuronal', minMag: 40 },
      { muestra: 'bacteria', obj: 'Cocos/Bacilos', minMag: 100 }
    ];
    const res = objetivos[Math.floor(Math.random() * objetivos.length)];
    // Random focus plane between 30 and 70
    const randomFocus = Math.floor(Math.random() * 40) + 30;
    return { 
      microscopio: { 
        ...state.microscopio, 
        muestra: res.muestra as any, 
        targetOrganelle: res.obj, 
        status: 'idle', 
        objetivoMag: 4, 
        enfoqueZ: 0, 
        focoIdealZ: randomFocus,
        iluminacion: 50,
        diafragmaIris: 100,
        aceiteInmersionAplicado: false,
        posicionX: 0, 
        posicionY: 0,
        capturas: [],
        magnificacionVerified: false,
        abbeVerified: false,
      },
      bitacoraData: { ...state.bitacoraData, objB1: res.obj, magMin: res.minMag }
    };
  }),
  validarB1: () => {
    // La validación matemática de Abbe y Magnificación ahora actúa como gate.
    // Solo validamos que la magnificación y luz sean correctas, y que no esté borroso.
    const { microscopio, bitacoraData } = get();
    const isMagOk = microscopio.objetivoMag >= (bitacoraData.magMin || 40);
    const isLightOk = microscopio.iluminacion >= 60 && microscopio.iluminacion <= 95;
    
    // Focus diff must be minimal (within depth of field approximation)
    const focusDiff = Math.abs(microscopio.enfoqueZ - microscopio.focoIdealZ);
    // 100x has shallow depth of field, 4x has high. If aim is 100x, it has to be VERY precise.
    const focusTolerance = microscopio.objetivoMag === 100 ? 1 : microscopio.objetivoMag === 40 ? 3 : 8;
    const isFocused = focusDiff <= focusTolerance;

    const isOk = isMagOk && isLightOk && isFocused;
    set((state) => ({ microscopio: { ...state.microscopio, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetB1: () => set((state) => ({ 
    microscopio: { 
      ...state.microscopio, 
      objetivoMag: 4, 
      enfoqueZ: 0, 
      iluminacion: 50, 
      posicionX: 0, 
      posicionY: 0, 
      status: 'idle',
      magnificacionVerified: false,
      abbeVerified: false,
    } 
  })),
  setTransporte: (data: Partial<SimuladorState['transporte']>) => set((state) => ({ transporte: { ...state.transporte, ...data } })),
  tickTransporte: (dt: number) => set((state) => {
    const { concExt, glucosaExt, concInt, volumen, temperatura, tipoCelula } = state.transporte;
    
    // Osmolaridad Total (i_nacl * C_nacl + i_glu * C_glu)
    const osmExt = (2 * concExt) + (1 * glucosaExt);
    const osmInt = 2 * concInt; 

    // Diferencial de presión osmótica (Van't Hoff mejorado)
    const R = 0.0821;
    const T = 273.15 + temperatura;
    const deltaPi = (osmExt - osmInt) * R * T;

    // Velocidad de flujo (Lp * deltaPi)
    // Lp es la conductividad hidráulica, afectada por la temperatura (Q10 rule)
    const LpBase = 0.08;
    const Lp = LpBase * Math.pow(1.5, (temperatura - 25) / 10);
    
    const dV = -Lp * deltaPi * dt;
    let newVol = volumen + dV;

    // Límites Biológicos
    if (tipoCelula === 'animal') {
      if (newVol > 180) newVol = 181; // Citólisis
      if (newVol < 40) newVol = 40;
    } else {
      if (newVol > 140) newVol = 140;
      if (newVol < 30) newVol = 30;
    }

    const newHistory = [...state.transporte.history, { time: Date.now(), volumen: newVol }].slice(-50);
    
    return { 
      transporte: { 
        ...state.transporte, 
        volumen: newVol, 
        presionOsmotica: Math.abs(deltaPi),
        history: newHistory 
      } 
    };
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
  generarSemillaB3: () => set((state) => ({ sintesis: { ...state.sintesis, adnPlantilla: 'TACCAGGGTTACATT', arnMensajero: '', proteina: [], errores: 0, currentIndex: 0, fase: 'transcripcion', status: 'idle' } })),
  resetB3: () => get().generarSemillaB3(),
  setFotosintesis: (data: Partial<SimuladorState['fotosintesis']>) => set((state) => ({ fotosintesis: { ...state.fotosintesis, ...data } })),
  tickFotosintesis: (dt: number) => set((state) => {
    if (!state.fotosintesis.simulando) return state;
    
    // Eficiencia por color (Espectro de absorción de Clorofila a y b)
    const colorEfficiency: Record<string, number> = {
      'blanco': 0.7,
      'rojo': 1.0,
      'azul': 1.2,
      'verde': 0.1, // La clorofila refleja el verde
      'amarillo': 0.4
    };

    const eff = colorEfficiency[state.fotosintesis.color] || 0.5;
    const intensity = 300 / (state.fotosintesis.distancia * state.fotosintesis.distancia);
    const rate = intensity * eff * dt * 1.5;

    const newO2 = Math.min(state.fotosintesis.targetO2, state.fotosintesis.oxigenoAcumulado + rate);
    
    return { 
      fotosintesis: { 
        ...state.fotosintesis, 
        oxigenoAcumulado: newO2, 
        tiempo: state.fotosintesis.tiempo + dt,
        status: newO2 >= state.fotosintesis.targetO2 ? 'success' : 'idle' 
      } 
    };
  }),
  generarSemillaB4: () => set((state) => {
    const escenarios = ['optimizacion_espectro', 'ley_distancia', 'supervivencia_marte'];
    const esc = escenarios[Math.floor(Math.random() * escenarios.length)];
    const target = esc === 'supervivencia_marte' ? 100 : 50;
    
    return { 
      fotosintesis: { 
        ...state.fotosintesis, 
        escenario: esc as any,
        oxigenoAcumulado: 0, 
        targetO2: target, 
        distancia: 5,
        color: 'blanco',
        simulando: false,
        tiempo: 0,
        status: 'idle' 
      } 
    };
  }),
  resetB4: () => set((state) => ({ 
    fotosintesis: { 
      ...state.fotosintesis, 
      oxigenoAcumulado: 0, 
      simulando: false, 
      tiempo: 0, 
      status: 'idle' 
    } 
  })),
  setGenetica: (data: Partial<SimuladorState['genetica']>) => set((state) => ({ genetica: { ...state.genetica, ...data } })),
  generarF1: () => set((state) => {
    const { padre1, padre2, tamanioMuestra } = state.genetica;
    
    // Función para obtener gametos (Mendel 2nd Law)
    const getGametos = (genotipo: string) => {
      const g1 = genotipo.slice(0, 2); // Aa
      const g2 = genotipo.slice(2, 4); // Bb
      const res = [];
      for (const a of g1) {
        for (const b of g2) {
          res.push(a + b);
        }
      }
      return res;
    };

    const g1 = getGametos(padre1);
    const g2 = getGametos(padre2);
    const f1 = [];

    for (let i = 0; i < tamanioMuestra; i++) {
      const gam1 = g1[Math.floor(Math.random() * g1.length)];
      const gam2 = g2[Math.floor(Math.random() * g2.length)];
      
      // Combinar alelos (Ej: AB + ab -> AaBb)
      const aleloA = [gam1[0], gam2[0]].sort().join('');
      const aleloB = [gam1[1], gam2[1]].sort().join('');
      f1.push(aleloA + aleloB);
    }

    return { genetica: { ...state.genetica, poblacionF1: f1, status: 'success' } };
  }),
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
  
  tomarCaptura: (url: string) => set((state) => ({ 
    microscopio: { 
      ...state.microscopio, 
      capturas: [url, ...state.microscopio.capturas].slice(0, 6) 
    } 
  })),
});
