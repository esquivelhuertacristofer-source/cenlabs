import { StateCreator } from 'zustand';
import { SimuladorState, QuimicaSlice } from '../types';
import * as QuimicaDomain from '@/domain/quimica';

// Constantes físico-químicas
const GAS_CONSTANT_R = QuimicaDomain.R_GAS; // L·atm/(mol·K)
const MIN_VOLUME_L   = 0.1;          // litros — previene división por cero
const EXPLOSION_THRESHOLD_ATM = 7.0; // presión máxima antes de fallo de cámara

// --- REACCIONES CONSTANTES (Fuera del slice para estabilidad y reparación) ---
// Enriquecidas con datos de nivel Licenciatura (Masa Molar)
type MoleculaReaccion = QuimicaDomain.MoleculaBalanceo & { estado: string };
type ReaccionDeBalanceo = { id: string; nombre: string; ecuacion: string; reactivos: MoleculaReaccion[]; productos: MoleculaReaccion[]; coeficientesCorrectos: number[] };
const REACCIONES_BALANCEO: ReaccionDeBalanceo[] = [
  { 
    id: 'propano',
    nombre: 'Combustión de Propano',
    ecuacion: 'C3H8(l) + O2(g) → CO2(g) + H2O(g)',
    reactivos: [
      { formula: 'C3H8', atomos: { C: 3, H: 8 }, molar: 44.097, estado: 'l' },
      { formula: 'O2', atomos: { O: 2 }, molar: 31.998, estado: 'g' }
    ],
    productos: [
      { formula: 'CO2', atomos: { C: 1, O: 2 }, molar: 44.009, estado: 'g' },
      { formula: 'H2O', atomos: { H: 2, O: 1 }, molar: 18.015, estado: 'g' }
    ],
    coeficientesCorrectos: [1, 5, 3, 4]
  },
  {
    id: 'fotosintesis',
    nombre: 'Fotosíntesis',
    ecuacion: 'CO2(g) + H2O(l) → C6H12O6(s) + O2(g)',
    reactivos: [
      { formula: 'CO2', atomos: { C: 1, O: 2 }, molar: 44.009, estado: 'g' },
      { formula: 'H2O', atomos: { H: 2, O: 1 }, molar: 18.015, estado: 'l' }
    ],
    productos: [
      { formula: 'C6H12O6', atomos: { C: 6, H: 12, O: 6 }, molar: 180.156, estado: 's' },
      { formula: 'O2', atomos: { O: 2 }, molar: 31.998, estado: 'g' }
    ],
    coeficientesCorrectos: [6, 6, 1, 6]
  },
  {
    id: 'haber',
    nombre: 'Proceso de Haber (Amoníaco)',
    ecuacion: 'N2(g) + H2(g) → NH3(g)',
    reactivos: [
      { formula: 'N2', atomos: { N: 2 }, molar: 28.014, estado: 'g' },
      { formula: 'H2', atomos: { H: 2 }, molar: 2.016, estado: 'g' }
    ],
    productos: [
      { formula: 'NH3', atomos: { N: 1, H: 3 }, molar: 17.031, estado: 'g' }
    ],
    coeficientesCorrectos: [1, 3, 2]
  },
  {
    id: 'metanol',
    nombre: 'Síntesis de Metanol',
    ecuacion: 'CO(g) + H2(g) → CH3OH(l)',
    reactivos: [
      { formula: 'CO', atomos: { C: 1, O: 1 }, molar: 28.010, estado: 'g' },
      { formula: 'H2', atomos: { H: 2 }, molar: 2.016, estado: 'g' }
    ],
    productos: [
      { formula: 'CH3OH', atomos: { C: 1, H: 4, O: 1 }, molar: 32.042, estado: 'l' }
    ],
    coeficientesCorrectos: [1, 2, 1]
  },
  {
    // Con HCl + NaOH los coeficientes iniciales (todos 1) ya eran la respuesta y la
    // reacción se «completaba» sin razonar; con ácido diprótico hay que balancear.
    id: 'neutralizacion',
    nombre: 'Neutralización Ácido-Base',
    ecuacion: 'H2SO4(aq) + NaOH(aq) → Na2SO4(aq) + H2O(l)',
    reactivos: [
      { formula: 'H2SO4', atomos: { H: 2, S: 1, O: 4 }, molar: 98.079, estado: 'aq' },
      { formula: 'NaOH', atomos: { Na: 1, O: 1, H: 1 }, molar: 39.997, estado: 'aq' }
    ],
    productos: [
      { formula: 'Na2SO4', atomos: { Na: 2, S: 1, O: 4 }, molar: 142.042, estado: 'aq' },
      { formula: 'H2O', atomos: { H: 2, O: 1 }, molar: 18.015, estado: 'l' }
    ],
    coeficientesCorrectos: [1, 2, 1, 2]
  },
  {
    id: 'octano',
    nombre: 'Combustión de Octano (Gasolina)',
    ecuacion: 'C8H18(l) + O2(g) → CO2(g) + H2O(g)',
    reactivos: [
      { formula: 'C8H18', atomos: { C: 8, H: 18 }, molar: 114.230, estado: 'l' },
      { formula: 'O2', atomos: { O: 2 }, molar: 31.998, estado: 'g' }
    ],
    productos: [
      { formula: 'CO2', atomos: { C: 1, O: 2 }, molar: 44.009, estado: 'g' },
      { formula: 'H2O', atomos: { H: 2, O: 1 }, molar: 18.015, estado: 'g' }
    ],
    coeficientesCorrectos: [2, 25, 16, 18]
  }
];

const REACCIONES_LIMITANTE = [
  { 
    id: 'agua', 
    nombre: 'Síntesis de Agua', 
    ecuacion: '2H2(g) + O2(g) → 2H2O(l)',
    reactivos: [
      { formula: 'H2', molar: 2.016, coef: 2 },
      { formula: 'O2', molar: 31.998, coef: 1 }
    ],
    productos: [
      { formula: 'H2O', molar: 18.015, coef: 2 }
    ]
  },
  { 
    id: 'haber', 
    nombre: 'Proceso de Haber', 
    ecuacion: 'N2(g) + 3H2(g) → 2NH3(g)',
    reactivos: [
      { formula: 'N2', molar: 28.014, coef: 1 },
      { formula: 'H2', molar: 2.016, coef: 3 }
    ],
    productos: [
      { formula: 'NH3', molar: 17.031, coef: 2 }
    ]
  },
  { 
    id: 'metano', 
    nombre: 'Combustión de Metano', 
    ecuacion: 'CH4(g) + 2O2(g) → CO2(g) + 2H2O(g)',
    reactivos: [
      { formula: 'CH4', molar: 16.043, coef: 1 },
      { formula: 'O2', molar: 31.998, coef: 2 }
    ],
    productos: [
      { formula: 'CO2', molar: 44.009, coef: 1 },
      { formula: 'H2O', molar: 18.015, coef: 2 }
    ]
  },
  { 
    id: 'nitrato', 
    nombre: 'Desplazamiento de Plata', 
    ecuacion: '2AgNO3(aq) + Cu(s) → Cu(NO3)2(aq) + 2Ag(s)',
    reactivos: [
      { formula: 'AgNO3', molar: 169.873, coef: 2 },
      { formula: 'Cu', molar: 63.546, coef: 1 }
    ],
    productos: [
      { formula: 'Cu(NO3)2', molar: 187.556, coef: 1 },
      { formula: 'Ag', molar: 107.868, coef: 2 }
    ]
  }
];

// Solubilidad tabulada (g / 100 g H₂O) — ver TABLAS_SOLUBILIDAD en el dominio (CRC).
const SUSTANCIAS_SOLUBILIDAD = [
  { id: 'kno3', nombre: 'Nitrato de Potasio', formula: 'KNO₃', color: '#ffffff', tabla: QuimicaDomain.TABLAS_SOLUBILIDAD.kno3, desc: 'Muy dependiente de la temperatura: de 31.6 g a 20 °C a 246 g a 100 °C.' },
  { id: 'nacl', nombre: 'Cloruro de Sodio', formula: 'NaCl', color: '#f8fafc', tabla: QuimicaDomain.TABLAS_SOLUBILIDAD.nacl, desc: 'Curva casi plana: 35.7 g a 0 °C y 39.2 g a 100 °C.' },
  { id: 'cuso4', nombre: 'Sulfato de Cobre (II)', formula: 'CuSO₄', color: '#3b82f6', tabla: QuimicaDomain.TABLAS_SOLUBILIDAD.cuso4, desc: 'Cristaliza como pentahidrato azul (CuSO₄·5H₂O).' },
  { id: 'kclo3', nombre: 'Clorato de Potasio', formula: 'KClO₃', color: '#e2e8f0', tabla: QuimicaDomain.TABLAS_SOLUBILIDAD.kclo3, desc: 'Muy poco soluble en frío: 3.3 g a 0 °C.' }
];

export const SUSTANCIAS_SOLUCIONES = [
  { nombre: "Cloruro de Sodio", formula: "NaCl", pm: 58.443, purity: 0.985, color: "#ffffff" },
  { nombre: "Sulfato de Cobre (II)", formula: "CuSO4", pm: 159.609, purity: 0.99, color: "#3b82f6" },
  { nombre: "Permanganato de Potasio", formula: "KMnO4", pm: 158.034, purity: 0.98, color: "#a855f7" },
  { nombre: "Dicromato de Potasio", formula: "K2Cr2O7", pm: 294.185, purity: 0.97, color: "#f97316" }
];

// Átomos y masas de la reacción de balanceo con los coeficientes dados.
function estadoBalanceo(reac: (typeof REACCIONES_BALANCEO)[number], coefs: number[]) {
  const { reactivos, productos } = QuimicaDomain.contarAtomos(reac, coefs);
  let mR = 0, mP = 0;
  reac.reactivos.forEach((m, i) => { mR += m.molar * (coefs[i] ?? 1); });
  reac.productos.forEach((m, i) => { mP += m.molar * (coefs[reac.reactivos.length + i] ?? 1); });
  return {
    atomosReactivos: reactivos,
    atomosProductos: productos,
    isBalanced: QuimicaDomain.estaBalanceada(reac, coefs),
    masaReactivos: parseFloat(mR.toFixed(3)),
    masaProductos: parseFloat(mP.toFixed(3)),
  };
}

// Resultados estequiométricos (los ve el panel SOLO después de validar).
function resultadosLimitante(reacIdx: number, masas: number[]) {
  const reac = REACCIONES_LIMITANTE[reacIdx] ?? REACCIONES_LIMITANTE[0];
  const a = QuimicaDomain.analizarLimitante(reac, masas);
  return {
    moles: a.moles.map((n) => parseFloat(n.toFixed(4))),
    limitingIdx: a.limitingIdx,
    theoreticalYield: parseFloat(a.theoreticalYield.toFixed(3)),
    excessMass: parseFloat(a.excessMass.toFixed(3)),
  };
}

const DESTILACION_INICIAL = {
  calorManta: 20, tempMezcla: 20, tempCabeza: 20, tasa: 0,
  volEtanolMatraz: 100, volAguaMatraz: 100,
  volDestilado: 0, volEtanolDest: 0, purezaDestilado: 0,
  status: 'idle' as const,
};

const JERINGAS_INICIALES = () => [
  { id: 1, ubicacion: 'mesa' as const, temp: 20 },
  { id: 2, ubicacion: 'mesa' as const, temp: 20 },
  { id: 3, ubicacion: 'mesa' as const, temp: 20 },
];

export const createQuimicaSlice: StateCreator<SimuladorState, [], [], QuimicaSlice> = (set, get) => ({
  particulas: {
    protones: 0, neutrones: 0, electrones: 0,
    targetZ: 6, targetA: 12, targetCharge: 0,
    intentos: 0, estrellas: 3,
    isStable: true, message: ""
  },
  gases: { missionId: 'sandbox', T: 300, V: 10, P: 1.0, n: 0.406, pTarget: 3.5, isExploded: false, gasType: 'He', mw: 4.002, status: 'idle' },
  balanceo: {
    reaccionActual: 0,
    reacciones: REACCIONES_BALANCEO,
    coeficientes: [1, 1, 1, 1],
    isBalanced: false,
    atomosReactivos: {} as Record<string, number>,
    atomosProductos: {} as Record<string, number>,
    masaReactivos: 0,
    masaProductos: 0,
    reaccionesCompletadas: [] as string[]
  },
  limitante: {
    reaccionActual: 0,
    reacciones: REACCIONES_LIMITANTE,
    inputMasses: [0, 0],
    targetYield: 0,
    results: {
      moles: [0, 0],
      limitingIdx: -1,
      theoreticalYield: 0,
      excessMass: 0
    },
    isRunning: false,
    status: 'idle',
    respuesta: { limitanteIdx: null, exceso: null },
  },
  soluciones: {
    mTarget: 0.5, vTarget: 250, mRequerida: 7.3,
    sal: { nombre: "Cloruro de Sodio", formula: "NaCl", pm: 58.443, purity: 0.985 },
    balanza: { polvo: 0, tara: false, encendida: true },
    matraz: { polvo: 0, agua: 0 },
    interaccion: { holding: null, jarraAbierta: false },
    status: 'idle'
  },
  solubilidad: {
    temp: 20,
    salAgregada: 0,
    ubicacion: 'mesa',
    status: 'idle',
    sustanciaIdx: 0,
    sustancias: SUSTANCIAS_SOLUBILIDAD,
    disueltoEnCaliente: false,
  },
  titulacion: { ca: 0.1, va: 25, cb: 0.1, volumenBase: 0, purgada: false, indicador: false, status: 'idle', history: [], respuestaCa: null },
  equilibrio: { jeringas: [], status: 'idle', observaciones: {} },
  celda: { vasoIzq: null, vasoDer: null, puenteSalino: false, cablesConectados: false, status: 'idle', seedMetales: [], voltaje: 0, respuesta: { anodo: null, catodo: null } },
  destilacion: { ...DESTILACION_INICIAL },

  // ── Q1 · Construcción atómica ─────────────────────────────────────────────
  // El catálogo llega hasta el neón (Z = 10) y la configuración hasta 2p (10 e⁻).
  setParticulas: (p: number, n: number, e: number) => set((state) => ({
    particulas: {
      ...state.particulas,
      protones: Math.min(10, Math.max(0, p)),
      neutrones: Math.max(0, n),
      electrones: Math.min(10, Math.max(0, e)),
    }
  })),
  validarEstructura: () => {
    const particulas = get().particulas;
    const result = QuimicaDomain.validarQ1(particulas);
    if (result.isOk) {
      get().registrarHallazgo('qmi01_success', { p: particulas.protones, n: particulas.neutrones, e: particulas.electrones });
      set((state) => ({
        particulas: {
          ...state.particulas,
          isStable: true,
          estrellas: result.estrellas!,
          message: result.message,
        },
      }));
    } else {
      set((state) => ({
        particulas: {
          ...state.particulas,
          isStable: false,
          intentos: particulas.intentos + 1,
          message: result.message,
        },
      }));
    }
    return result.isOk;
  },
  setTargetElement: (z: number, a: number) => set((state) => ({
    particulas: { ...state.particulas, targetZ: z, targetA: a, targetCharge: 0, intentos: 0, estrellas: 3, message: '', isStable: true }
  })),
  setTargetCharge: (charge: number) => set((state) => ({
    particulas: { ...state.particulas, targetCharge: charge, intentos: 0, estrellas: 3, message: '', isStable: true }
  })),
  resetParticulas: () => set((state) => ({
    particulas: {
      ...state.particulas,
      protones: 0, neutrones: 0, electrones: 0,
      isStable: true, message: "", intentos: 0, estrellas: 3
    }
  })),

  // ── Q2 · Gases ideales ────────────────────────────────────────────────────
  updateGases: (t: number, v: number, n?: number) => set((state) => {
    if (state.gases.isExploded) return state;
    const currentN = n !== undefined ? n : state.gases.n;
    const safeV = Math.max(MIN_VOLUME_L, v);
    const computedP = (currentN * GAS_CONSTANT_R * t) / safeV;
    const willExplode = computedP > EXPLOSION_THRESHOLD_ATM;
    return {
      gases: {
        ...state.gases,
        T: t, V: safeV, n: currentN,
        P: parseFloat(computedP.toFixed(3)),
        isExploded: willExplode
      }
    };
  }),
  validarQ2: () => {
    const g = get().gases;
    const isOk = QuimicaDomain.validarQ2(g);
    if (isOk) get().registrarHallazgo('qui_gases', { T: g.T, V: g.V, P: g.P, n: g.n, pTarget: g.pTarget });
    set((state) => ({ gases: { ...state.gases, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  // Reiniciar la cámara (p. ej. tras una explosión) conserva el objetivo de presión:
  // el reto sigue siendo el mismo. La semilla nueva la pone `entrarQuimica`.
  resetGases: () => set((state) => ({
    gases: {
      ...state.gases,
      missionId: 'sandbox',
      T: 300, V: 10, P: 1.0, n: 0.406, isExploded: false,
      gasType: 'He', mw: 4.002,
      status: 'idle'
    },
    bitacoraData: { ...state.bitacoraData, gases_logs: [] }
  })),
  setGasesMission: (missionId: 'sandbox' | 'boyle' | 'charles' | 'gaylussac' | 'avogadro') => set((state) => {
    let T = 300, V = 10, n = 0.406, pTarget = 3.5;
    const R = GAS_CONSTANT_R;

    switch(missionId) {
      case 'boyle': // T and n fixed
        T = 300; n = 0.5; V = 10;
        pTarget = 1.2;
        break;
      case 'charles': // P maintained, T vs V
        T = 300; n = 0.406; V = 10;
        pTarget = 1.5;
        break;
      case 'gaylussac': // V fixed, Emergency pressure
        T = 550; n = 0.6; V = 5.0; // High pressure start
        pTarget = 3.0;
        break;
      case 'avogadro': // T and V fixed, Leak scenario
        T = 400; V = 8.0; n = 0.3; // Low pressure start
        pTarget = 2.5;
        break;
      case 'sandbox':
      default:
        T = 300; V = 10; n = 0.406;
        pTarget = 3.5;
        break;
    }

    const computedP = (n * R * T) / V;

    return {
      gases: {
        ...state.gases,
        missionId,
        T, V, n, pTarget,
        P: parseFloat(computedP.toFixed(3)),
        isExploded: false
      }
    };
  }),
  setGasType: (type: 'He' | 'Ne' | 'CO2') => set((state) => {
    const mwMap = { He: 4.002, Ne: 20.18, CO2: 44.01 };
    return {
      gases: {
        ...state.gases,
        gasType: type,
        mw: mwMap[type]
      }
    };
  }),
  generarSemillaGases: () => set((state) => ({
    gases: {
      ...state.gases,
      pTarget: parseFloat((1.5 + Math.random() * 4.5).toFixed(2))
    }
  })),

  // ── Q3 · Balanceo de ecuaciones ───────────────────────────────────────────
  // Una reacción cuenta como completada solo con los coeficientes enteros MÍNIMOS.
  setCoeficiente: (index: number, value: number) => set((state) => {
    const b = state.balanceo;
    const reac = REACCIONES_BALANCEO[b.reaccionActual ?? 0] ?? REACCIONES_BALANCEO[0];
    const size = reac.reactivos.length + reac.productos.length;
    const nCoef = Array.from({ length: size }, (_, i) => b.coeficientes?.[i] ?? 1);
    nCoef[index] = Math.min(30, Math.max(1, Math.round(value)));

    const nCompletadas = [...(b.reaccionesCompletadas || [])];
    if (QuimicaDomain.esBalanceoMinimo(reac, nCoef) && !nCompletadas.includes(reac.id)) {
      nCompletadas.push(reac.id);
    }

    return {
      balanceo: {
        ...b,
        reacciones: REACCIONES_BALANCEO,
        coeficientes: nCoef,
        ...estadoBalanceo(reac, nCoef),
        reaccionesCompletadas: nCompletadas
      }
    };
  }),
  setReaccion: (index: number) => set((state) => {
    const b = state.balanceo;
    if (index < 0 || index >= REACCIONES_BALANCEO.length) return state;
    if (index > 0) {
      const prevReac = REACCIONES_BALANCEO[index - 1];
      if (!b.reaccionesCompletadas?.includes(prevReac.id)) return state; // Bloqueado
    }
    const reac = REACCIONES_BALANCEO[index];
    const coefs = Array(reac.reactivos.length + reac.productos.length).fill(1);
    return {
      balanceo: {
        ...b,
        reacciones: REACCIONES_BALANCEO,
        reaccionActual: index,
        coeficientes: coefs,
        ...estadoBalanceo(reac, coefs),
      }
    };
  }),
  resetBalanceo: () => set((state) => {
    const reac = REACCIONES_BALANCEO[0];
    const coefs = Array(reac.reactivos.length + reac.productos.length).fill(1);
    return {
      balanceo: {
        ...state.balanceo,
        reacciones: REACCIONES_BALANCEO,
        reaccionActual: 0,
        coeficientes: coefs,
        reaccionesCompletadas: [],
        ...estadoBalanceo(reac, coefs),
      }
    };
  }),
  validarQ3: () => QuimicaDomain.validarQ3(get().balanceo),

  // ── Q4 · Reactivo limitante ───────────────────────────────────────────────
  // Cada misión trae masas sembradas con un limitante claro; el alumno identifica
  // el limitante y calcula el exceso en la consola. Los resultados se guardan para
  // la animación y el informe, pero el panel no los muestra hasta validar.
  setReaccionLimitante: (index: number) => {
    const idx = REACCIONES_LIMITANTE[index] ? index : 0;
    set((state) => ({ limitante: { ...state.limitante, reaccionActual: idx } }));
    get().generarSemillaP4();
  },
  setInputMass: (idx: number, mass: number) => set((state) => {
    const l = state.limitante;
    const newMasses = [...(l.inputMasses || [0, 0])];
    newMasses[idx] = Math.max(0, mass);
    const results = resultadosLimitante(l.reaccionActual ?? 0, newMasses);
    return { limitante: { ...l, inputMasses: newMasses, results, targetYield: results.theoreticalYield, status: 'idle' } };
  }),
  generarSemillaP4: () => set((state) => {
    const l = state.limitante;
    const actIdx = REACCIONES_LIMITANTE[l.reaccionActual ?? 0] ? (l.reaccionActual ?? 0) : 0;
    const masas = QuimicaDomain.generarMasasLimitante(REACCIONES_LIMITANTE[actIdx]);
    const results = resultadosLimitante(actIdx, masas);
    return {
      limitante: {
        ...l,
        reacciones: REACCIONES_LIMITANTE,
        reaccionActual: actIdx,
        inputMasses: masas,
        targetYield: results.theoreticalYield,
        results,
        respuesta: { limitanteIdx: null, exceso: null },
        status: 'idle',
        isRunning: false
      }
    };
  }),
  setRespuestaP4: (limitanteIdx: number | null, exceso: number | null) => set((state) => ({
    limitante: { ...state.limitante, respuesta: { limitanteIdx, exceso }, status: state.limitante.status === 'success' ? 'success' : 'idle' }
  })),
  validarP4: () => {
    const veredicto = QuimicaDomain.validarQ4(get().limitante);
    if (veredicto.ok) {
      const l = get().limitante;
      get().registrarHallazgo('reactivo_limitante', {
        reaccion: l.reacciones?.[l.reaccionActual]?.nombre,
        masas: l.inputMasses,
        limitanteIdx: l.respuesta.limitanteIdx,
        exceso: l.respuesta.exceso,
        rendimientoTeorico: l.results?.theoreticalYield,
      });
    }
    set((state) => ({ limitante: { ...state.limitante, status: veredicto.ok ? 'success' : 'error', isRunning: veredicto.ok } }));
    return veredicto.ok;
  },
  resetP4: () => set((state) => ({
    limitante: {
      ...state.limitante,
      reaccionActual: 0,
      inputMasses: [0, 0],
      results: { moles: [0, 0], limitingIdx: -1, theoreticalYield: 0, excessMass: 0 },
      respuesta: { limitanteIdx: null, exceso: null },
      isRunning: false,
      status: 'idle'
    }
  })),

  // ── Q5 · Preparación de soluciones ────────────────────────────────────────
  generarSemillaP5: () => set((state) => {
    const s = state.soluciones;
    const mTarget = parseFloat((0.1 + Math.random() * 0.9).toFixed(2)), vTarget = [100, 250, 500][Math.floor(Math.random() * 3)];
    const saltIdx = Math.floor(Math.random() * SUSTANCIAS_SOLUCIONES.length);
    const sal = SUSTANCIAS_SOLUCIONES[saltIdx];
    const pm = sal.pm, purity = sal.purity;
    const mRequerida = parseFloat(((mTarget * (vTarget / 1000) * pm) / purity).toFixed(3));
    return { soluciones: { ...s, mTarget, vTarget, mRequerida, sal, status: 'idle' }, bitacoraData: { ...state.bitacoraData, mTarget, vTarget, mReq: mRequerida } };
  }),
  // Se pesa sobre el vidrio de reloj ya tarado: sin tara no se puede añadir (la
  // lectura incluiría el vidrio). Un monto negativo es retirar con la espátula.
  addPolvo: (amount: number) => set((state) => {
    const b = state.soluciones.balanza;
    if (!b.encendida || !b.tara) return state;
    const next = Math.max(0, parseFloat((b.polvo + amount).toFixed(3)));
    if (next === b.polvo) return state;
    return { soluciones: { ...state.soluciones, balanza: { ...b, polvo: next } } };
  }),
  // TARA pone a cero la balanza con el vidrio de reloj encima. Con polvo ya pesado
  // no se re-tara (borraría la lectura); vacía, se puede quitar la tara.
  toggleTara: () => set((state) => {
    const b = state.soluciones.balanza;
    if (b.tara && b.polvo > 0) return state;
    return { soluciones: { ...state.soluciones, balanza: { ...b, tara: !b.tara } } };
  }),
  transferirPolvo: () => set((state) => ({ soluciones: { ...state.soluciones, matraz: { ...state.soluciones.matraz, polvo: state.soluciones.balanza.polvo }, balanza: { ...state.soluciones.balanza, polvo: 0 }, status: 'transferred' } })),
  setAgua: (amount: number) => set((state) => ({ soluciones: { ...state.soluciones, matraz: { ...state.soluciones.matraz, agua: Math.max(0, parseFloat(amount.toFixed(2))) } } })),
  setHolding: (item: string | null) => set((state) => ({ soluciones: { ...state.soluciones, interaccion: { ...(state.soluciones.interaccion || { holding: null, jarraAbierta: false }), holding: item } } })),
  toggleJar: () => set((state) => ({ soluciones: { ...state.soluciones, interaccion: { ...(state.soluciones.interaccion || { holding: null, jarraAbierta: false }), jarraAbierta: !state.soluciones.interaccion?.jarraAbierta } } })),
  setSal: (idx: number) => set((state) => {
    const s = SUSTANCIAS_SOLUCIONES[idx] || SUSTANCIAS_SOLUCIONES[0];
    const { mTarget, vTarget } = state.soluciones;
    const mRequerida = parseFloat(((mTarget * (vTarget / 1000) * s.pm) / s.purity).toFixed(3));
    return {
      soluciones: {
        ...state.soluciones,
        sal: s,
        mRequerida,
        status: 'idle',
        balanza: { polvo: 0, tara: false, encendida: true },
        matraz: { polvo: 0, agua: 0 },
      }
    };
  }),
  validarP5: () => {
    const soluciones = get().soluciones;
    const veredicto = QuimicaDomain.validarQ5(soluciones);
    if (veredicto.ok) {
      const mActual = QuimicaDomain.molaridadSolucion(soluciones);
      get().registrarHallazgo('preparacion_soluciones', {
        sustancia: soluciones.sal?.nombre,
        m_objetivo: soluciones.mTarget,
        m_lograda: parseFloat(mActual.toFixed(4)),
        v_total: soluciones.vTarget,
        masa_pesada: soluciones.matraz.polvo,
        precision: parseFloat((100 - Math.abs((mActual - soluciones.mTarget) / soluciones.mTarget) * 100).toFixed(2)),
      });
    }
    set((state) => ({ soluciones: { ...state.soluciones, status: veredicto.ok ? 'success' : 'error' } }));
    return veredicto.ok;
  },
  resetP5: () => set((state) => ({
    soluciones: {
      ...state.soluciones,
      matraz: { polvo: 0, agua: 0 },
      balanza: { polvo: 0, tara: false, encendida: true },
      status: 'idle'
    }
  })),

  // ── Q6 · Solubilidad y cristalización ─────────────────────────────────────
  setUbicacionVaso: (loc: 'mesa' | 'parrilla' | 'hielo') => set((state) => ({ solubilidad: { ...state.solubilidad, ubicacion: loc } })),
  setSustanciaSolubilidad: (idx: number) => set((state) => ({
    solubilidad: {
      ...state.solubilidad,
      sustanciaIdx: idx,
      salAgregada: 0,
      temp: 20,
      disueltoEnCaliente: false,
      status: 'idle'
    }
  })),
  // Añadir sal que no se disuelve a la temperatura actual anula la disolución en
  // caliente lograda antes: hay que volver a disolverla toda.
  addSalSolubilidad: (amount: number) => set((state) => {
    const sol = state.solubilidad;
    const s = sol.sustancias[sol.sustanciaIdx];
    const salAgregada = Math.min(300, Math.max(0, sol.salAgregada + amount));
    return { solubilidad: { ...sol, salAgregada, disueltoEnCaliente: s ? QuimicaDomain.disueltaEnCaliente(s.tabla, salAgregada, sol.temp) : false, status: 'idle' } };
  }),
  // dt en segundos. La parrilla calienta ~4 °C/s hasta 100 °C; el hielo y la mesa
  // llevan el vaso hacia 0 °C y 20 °C (enfriamiento de Newton). Sin cambio, no escribe.
  updateTemperaturaP6: (dt: number) => set((state) => {
    const sol = state.solubilidad;
    let newTemp = sol.temp;
    if (sol.ubicacion === 'parrilla') newTemp = Math.min(100, newTemp + 4 * dt);
    else if (sol.ubicacion === 'hielo') newTemp = newTemp * Math.exp(-dt / 6);
    else newTemp = 20 + (newTemp - 20) * Math.exp(-dt / 25);
    if (Math.abs(newTemp - sol.temp) < 0.01) return state;
    const s = sol.sustancias[sol.sustanciaIdx];
    const disuelto = sol.disueltoEnCaliente || (s ? QuimicaDomain.disueltaEnCaliente(s.tabla, sol.salAgregada, newTemp) : false);
    return { solubilidad: { ...sol, temp: newTemp, disueltoEnCaliente: disuelto } };
  }),
  validarP6: () => {
    const solubilidad = get().solubilidad;
    const veredicto = QuimicaDomain.validarQ6(solubilidad);
    if (veredicto.ok) {
      const s = solubilidad.sustancias[solubilidad.sustanciaIdx];
      get().registrarHallazgo('solubilidad_cristalizacion', {
        sustancia: s?.nombre,
        temperatura: parseFloat(solubilidad.temp.toFixed(1)),
        masa_agregada: solubilidad.salAgregada,
        limite_solubilidad: s ? parseFloat(QuimicaDomain.solubilidadA(s.tabla, solubilidad.temp).toFixed(1)) : 0,
        cristales: s ? parseFloat((solubilidad.salAgregada - QuimicaDomain.solubilidadA(s.tabla, solubilidad.temp)).toFixed(1)) : 0,
      });
    }
    set((state) => ({ solubilidad: { ...state.solubilidad, status: veredicto.ok ? 'success' : 'error' } }));
    return veredicto.ok;
  },
  resetP6: () => set((state) => ({ solubilidad: { ...state.solubilidad, temp: 20, salAgregada: 0, ubicacion: 'mesa', disueltoEnCaliente: false, status: 'idle' } })),

  // ── Q7 · Titulación ácido-base ────────────────────────────────────────────
  // [HCl] entre 0.050 y 0.180 M → V_eq = 12.5–45 mL, siempre dentro de la bureta de 50 mL.
  generarSemillaP7: () => set((state) => {
    const ca = parseFloat((0.05 + Math.random() * 0.13).toFixed(3)), cb = 0.1, va = 25;
    return { titulacion: { ...state.titulacion, ca, cb, va, volumenBase: 0, status: 'idle', history: [], respuestaCa: null } };
  }),
  addDropNaOH: (amount: number) => set((state) => {
    const t = state.titulacion;
    const newVol = Math.min(QuimicaDomain.CAPACIDAD_BURETA_ML, parseFloat((t.volumenBase + amount).toFixed(3)));
    if (newVol === t.volumenBase) return state;
    const ph = QuimicaDomain.phTitulacion(t.ca, t.va, t.cb, newVol);
    return { titulacion: { ...t, volumenBase: newVol, history: [...t.history, { vol: newVol, ph: parseFloat(ph.toFixed(2)) }].slice(-1200) } };
  }),
  toggleIndicadorP7: () => set((state) => ({ titulacion: { ...state.titulacion, indicador: !state.titulacion.indicador } })),
  togglePurgaP7: () => set((state) => ({ titulacion: { ...state.titulacion, purgada: !state.titulacion.purgada } })),
  setRespuestaP7: (ca: number | null) => set((state) => ({ titulacion: { ...state.titulacion, respuestaCa: ca } })),
  validarP7: () => {
    const veredicto = QuimicaDomain.validarQ7(get().titulacion);
    if (veredicto.ok) {
      const t = get().titulacion;
      get().registrarHallazgo('titulacion_acido_base', {
        ca_real: t.ca,
        ca_respuesta: t.respuestaCa,
        vol_base: t.volumenBase,
        cb: t.cb,
        va: t.va,
      });
    }
    set((state) => ({ titulacion: { ...state.titulacion, status: veredicto.ok ? 'success' : 'error' } }));
    return veredicto.ok;
  },
  resetP7: () => set((state) => ({ titulacion: { ...state.titulacion, volumenBase: 0, status: 'idle', history: [], purgada: false, indicador: false, respuestaCa: null } })),

  // ── Q8 · Equilibrio N₂O₄ ⇌ 2NO₂ ───────────────────────────────────────────
  // Mover una jeringa invalida lo que se había anotado de ella.
  setUbicacionJeringa: (id: number, loc: 'mesa' | 'caliente' | 'hielo') => set((state) => {
    const observaciones = { ...state.equilibrio.observaciones };
    delete observaciones[id];
    return {
      equilibrio: {
        ...state.equilibrio,
        observaciones,
        status: 'idle',
        jeringas: state.equilibrio.jeringas.map(j => j.id === id ? { ...j, ubicacion: loc } : j),
      }
    };
  }),
  // dt en segundos: cada jeringa tiende a la temperatura de su baño (τ ≈ 2.5 s).
  updateTemperaturaP8: (dt: number) => set((state) => {
    let cambio = false;
    const jeringas = state.equilibrio.jeringas.map(j => {
      const target = QuimicaDomain.TEMP_BANO_Q8[j.ubicacion];
      if (j.temp === target) return j;
      let temp = target + (j.temp - target) * Math.exp(-dt / 2.5);
      if (Math.abs(temp - target) < 0.05) temp = target;
      cambio = true;
      return { ...j, temp };
    });
    return cambio ? { equilibrio: { ...state.equilibrio, jeringas } } : state;
  }),
  setObservacionP8: (id: number, color: string) => set((state) => ({
    equilibrio: { ...state.equilibrio, status: 'idle', observaciones: { ...state.equilibrio.observaciones, [id]: color } }
  })),
  validarP8: () => {
    const veredicto = QuimicaDomain.validarQ8(get().equilibrio);
    if (veredicto.ok) {
      const eq = get().equilibrio;
      get().registrarHallazgo('equilibrio_quimico', {
        jeringas: eq.jeringas.map(j => ({ id: j.id, ubicacion: j.ubicacion, temp: parseFloat(j.temp.toFixed(1)), color: eq.observaciones[j.id] })),
      });
    }
    set((state) => ({ equilibrio: { ...state.equilibrio, status: veredicto.ok ? 'success' : 'error' } }));
    return veredicto.ok;
  },
  resetP8: () => set(() => ({ equilibrio: { jeringas: JERINGAS_INICIALES(), status: 'idle', observaciones: {} } })),
  generarSemillaP8: () => set(() => ({ equilibrio: { jeringas: JERINGAS_INICIALES(), status: 'idle', observaciones: {} } })),
  autoResolveP8: () => {},

  // ── Q9 · Celda galvánica ──────────────────────────────────────────────────
  generarSemillaP9: () => set((state) => {
    const metals = ['Zn', 'Cu', 'Ag', 'Mg'];
    const i = Math.floor(Math.random() * metals.length);
    let j = Math.floor(Math.random() * (metals.length - 1));
    if (j >= i) j++;
    return { celda: { ...state.celda, seedMetales: [metals[i], metals[j]], vasoIzq: null, vasoDer: null, status: 'idle', puenteSalino: false, cablesConectados: false, voltaje: 0, respuesta: { anodo: null, catodo: null } } };
  }),

  setMetalVaso: (vaso: 'izq' | 'der', metal: string | null) => set((state) => {
    const nCelda = { ...state.celda, [vaso === 'izq' ? 'vasoIzq' : 'vasoDer']: metal, status: 'idle' as const };
    nCelda.voltaje = calculateVoltaje(nCelda);
    return { celda: nCelda };
  }),

  togglePuenteSalino: () => set((state) => {
    const nCelda = { ...state.celda, puenteSalino: !state.celda.puenteSalino };
    nCelda.voltaje = calculateVoltaje(nCelda);
    return { celda: nCelda };
  }),

  toggleCables: () => set((state) => {
    const nCelda = { ...state.celda, cablesConectados: !state.celda.cablesConectados };
    nCelda.voltaje = calculateVoltaje(nCelda);
    return { celda: nCelda };
  }),

  setRespuestaP9: (anodo: string | null, catodo: string | null) => set((state) => ({
    celda: { ...state.celda, respuesta: { anodo, catodo }, status: 'idle' }
  })),

  validarP9: () => {
    const veredicto = QuimicaDomain.validarQ9(get().celda);
    if (veredicto.ok) {
      const c = get().celda;
      get().registrarHallazgo('qui_celda_galvanica', { anodo: c.respuesta.anodo, catodo: c.respuesta.catodo, voltaje: c.voltaje });
    }
    set((state) => ({ celda: { ...state.celda, status: veredicto.ok ? 'success' : 'error' } }));
    return veredicto.ok;
  },

  // Desmonta la celda pero conserva la pareja de metales del reto (la nueva la pone generarSemillaP9).
  resetP9: () => set((state) => ({ celda: { ...state.celda, vasoIzq: null, vasoDer: null, puenteSalino: false, cablesConectados: false, status: 'idle', voltaje: 0, respuesta: { anodo: null, catodo: null } } })),

  // ── Q10 · Destilación fraccionada ─────────────────────────────────────────
  setCalorManta: (temp: number) => set((state) => ({ destilacion: { ...state.destilacion, calorManta: Math.min(150, Math.max(20, temp)) } })),
  updateDestilacion: (dt: number) => set((state) => {
    const d = state.destilacion;
    if (d.status === 'success') return state;
    // Frío y apagado: nada que simular, no se reescribe el store.
    if (d.calorManta <= 20 && Math.abs(d.tempMezcla - 20) < 0.01 && Math.abs(d.tempCabeza - 20) < 0.01) return state;
    return { destilacion: QuimicaDomain.pasoDestilacion(d, dt) };
  }),
  validarP10: () => {
    const veredicto = QuimicaDomain.validarQ10(get().destilacion);
    if (veredicto.ok) {
      const d = get().destilacion;
      get().registrarHallazgo('qui_destilacion_fraccionada', { volDestilado: parseFloat(d.volDestilado.toFixed(1)), pureza: parseFloat(d.purezaDestilado.toFixed(1)) });
    }
    set((state) => ({ destilacion: { ...state.destilacion, status: veredicto.ok ? 'success' : 'error' } }));
    return veredicto.ok;
  },
  resetP10: () => set(() => ({ destilacion: { ...DESTILACION_INICIAL } })),

  // Cada vez que se abre un lab de química: intento nuevo (reset + semilla).
  entrarQuimica: (n: number) => {
    const g = get();
    switch (n) {
      case 1: g.resetParticulas(); break;
      case 2: g.resetGases(); g.generarSemillaGases(); break;
      case 3: g.resetBalanceo(); break;
      case 4: g.resetP4(); g.generarSemillaP4(); break;
      case 5: g.resetP5(); g.generarSemillaP5(); break;
      case 6: g.resetP6(); break;
      case 7: g.resetP7(); g.generarSemillaP7(); break;
      case 8: g.resetP8(); g.generarSemillaP8(); break;
      case 9: g.resetP9(); g.generarSemillaP9(); break;
      case 10: g.resetP10(); break;
    }
  },
  // Único juez del botón «Validar práctica» para química. Cada caso evalúa el reto
  // con el validador de dominio sobre el estado del store y devuelve su mensaje.
  validarLabQuimica: (n: number) => {
    const g = get();
    switch (n) {
      case 1: {
        const ok = g.validarEstructura();
        return { ok, mensaje: ok ? undefined : get().particulas.message || undefined };
      }
      case 2: {
        const ok = g.validarQ2();
        return { ok, mensaje: ok ? undefined : g.gases.isExploded
          ? 'La cámara colapsó. Reiníciala y alcanza la presión objetivo sin pasar de 7 atm.'
          : 'La presión aún no coincide con el objetivo (±0.1 atm). Ajusta T, V o los moles.' };
      }
      case 3: {
        const ok = g.validarQ3();
        const completed = get().balanceo.reaccionesCompletadas?.length || 0;
        return { ok, mensaje: ok ? undefined : `Balanceo incompleto: llevas ${completed} de ${QuimicaDomain.REACCIONES_REQUERIDAS_Q3} reacciones balanceadas con coeficientes mínimos.` };
      }
      case 4: { const v = QuimicaDomain.validarQ4(g.limitante); g.validarP4(); return v; }
      case 5: { const v = QuimicaDomain.validarQ5(g.soluciones); g.validarP5(); return v; }
      case 6: { const v = QuimicaDomain.validarQ6(g.solubilidad); g.validarP6(); return v; }
      case 7: { const v = QuimicaDomain.validarQ7(g.titulacion); g.validarP7(); return v; }
      case 8: { const v = QuimicaDomain.validarQ8(g.equilibrio); g.validarP8(); return v; }
      case 9: { const v = QuimicaDomain.validarQ9(g.celda); g.validarP9(); return v; }
      case 10: { const v = QuimicaDomain.validarQ10(g.destilacion); g.validarP10(); return v; }
    }
    return { ok: false };
  },
  resetQuimica: () => {
    get().resetParticulas();
    get().resetGases();
    get().resetBalanceo();
    get().resetP4();
    get().resetP5();
    get().resetP6();
    get().resetP7();
    get().resetP8();
    get().resetP9();
    get().resetP10();
  },
});

// Lectura del voltímetro: 0 con el circuito abierto; con él cerrado, E°(der) − E°(izq)
// con signo (la punta COM va al vaso izquierdo). Ver `lecturaVoltimetro` en el dominio.
const calculateVoltaje = (celda: SimuladorState['celda']) => {
  if (!celda.vasoIzq || !celda.vasoDer || !celda.puenteSalino || !celda.cablesConectados) return 0;
  return QuimicaDomain.lecturaVoltimetro(celda.vasoIzq, celda.vasoDer);
};
