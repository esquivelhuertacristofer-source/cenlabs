import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';

// --- REACCIONES CONSTANTES (Fuera del slice para estabilidad y reparación) ---
// Enriquecidas con datos de nivel Licenciatura (Masa Molar)
const REACCIONES_BALANCEO = [
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
      { formula: 'N2', atomos: { N: 2 }, molar: 28.013, estado: 'g' },
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
    id: 'neutralizacion',
    nombre: 'Neutralización Ácido-Base',
    ecuacion: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H2O(l)',
    reactivos: [
      { formula: 'HCl', atomos: { H: 1, Cl: 1 }, molar: 36.460, estado: 'aq' },
      { formula: 'NaOH', atomos: { Na: 1, O: 1, H: 1 }, molar: 39.997, estado: 'aq' }
    ],
    productos: [
      { formula: 'NaCl', atomos: { Na: 1, Cl: 1 }, molar: 58.440, estado: 'aq' },
      { formula: 'H2O', atomos: { H: 2, O: 1 }, molar: 18.015, estado: 'l' }
    ],
    coeficientesCorrectos: [1, 1, 1, 1]
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
      { formula: 'N2', molar: 28.013, coef: 1 },
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

const SUSTANCIAS_SOLUBILIDAD = [
  { id: 'kno3', nombre: 'Nitrato de Potasio', formula: 'KNO₃', color: '#ffffff', a: 31.6, b: 0.02, desc: 'Alta dependencia térmica.' },
  { id: 'nacl', nombre: 'Cloruro de Sodio', formula: 'NaCl', color: '#f8fafc', a: 35.7, b: 0.001, desc: 'Curva casi plana.' },
  { id: 'cuso4', nombre: 'Sulfato de Cobre (II)', formula: 'CuSO₄', color: '#3b82f6', a: 14.3, b: 0.025, desc: 'Cristales azules vibrantes.' },
  { id: 'kclo3', nombre: 'Clorato de Potasio', formula: 'KClO₃', color: '#e2e8f0', a: 3.3, b: 0.04, desc: 'Muy baja solubilidad en frío.' }
];

export const createQuimicaSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  particulas: { 
    protones: 0, neutrones: 0, electrones: 0, 
    targetZ: 6, targetA: 14, targetCharge: 0,
    intentos: 0, estrellas: 3,
    isStable: true, message: "" 
  },
  gases: { T: 300, V: 10, P: 1.0, n: 0.406, pTarget: 3.5, isExploded: false, gasType: 'Argón', mw: 39.948 },
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
    status: 'idle' 
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
    sustancias: SUSTANCIAS_SOLUBILIDAD
  },
  titulacion: { ca: 0.1, va: 25, cb: 0.1, volumenBase: 0, purgada: false, indicador: false, status: 'idle', history: [] },
  equilibrio: { jeringas: [], status: 'idle' },
  celda: { vasoIzq: null, vasoDer: null, puenteSalino: false, cablesConectados: false, status: 'idle', seedMetales: [], voltaje: 0 },
  destilacion: { calorManta: 20, tempMezcla: 20, volEtanolMatraz: 100, volAguaMatraz: 100, volDestilado: 0, purezaDestilado: 0, status: 'idle' },

  setParticulas: (p: number, n: number, e: number) => set((state) => ({ 
    particulas: { ...state.particulas, protones: Math.max(0, p), neutrones: Math.max(0, n), electrones: Math.max(0, e) } 
  })),
  validarEstructura: () => {
    const { protones, neutrones, electrones, targetZ, targetA, targetCharge, intentos } = get().particulas;
    const list: Record<number, string> = { 1: "Hidrógeno", 2: "Helio", 3: "Litio", 4: "Berilio", 5: "Boro", 6: "Carbono", 7: "Nitrógeno", 8: "Oxígeno", 9: "Flúor", 10: "Neón" };
    const targetName = list[targetZ] || "Elemento";
    const expectedElectrons = targetZ - targetCharge;
    const isCorrectElement  = protones === targetZ;
    const isCorrectIsotope  = (protones + neutrones) === targetA;
    const isCorrectCharge   = electrones === expectedElectrons;

    if (isCorrectElement && isCorrectIsotope && isCorrectCharge) {
      const chargeLabel = targetCharge === 0 ? 'neutro' : `${targetCharge > 0 ? '+' : ''}${targetCharge}`;
      const newEstrellas = intentos === 0 ? 3 : intentos === 1 ? 2 : 1;
      set((state) => ({ 
        particulas: { 
          ...state.particulas, 
          isStable: true,
          estrellas: newEstrellas,
          message: `¡${targetName}${targetCharge !== 0 ? chargeLabel : ''} logrado! ${newEstrellas === 3 ? '¡Perfecto al primer intento!' : ''}`
        }
      }));
      return true;
    } else {
      let msg = "Configuración subatómica incorrecta.";
      if (!isCorrectElement)  msg = `Elemento incorrecto: tienes Z=${protones} (${list[protones] ?? 'desconocido'}), necesitas Z=${targetZ} (${targetName}).`;
      else if (!isCorrectIsotope) msg = `Masa atómica incorrecta: A=${protones+neutrones}, necesitas A=${targetA}. Verifica neutrones (N=${targetA-targetZ}).`;
      else if (!isCorrectCharge) msg = targetCharge === 0
        ? `Carga neta ≠ 0: tienes ${electrones} e⁻, necesitas ${expectedElectrons} para átomo neutro.`
        : `Carga incorrecta: necesitas ${targetCharge > 0 ? 'ceder' : 'ganar'} ${Math.abs(targetCharge)} e⁻ (${expectedElectrons} e⁻ en total).`;
      set((state) => ({ 
        particulas: { ...state.particulas, isStable: false, intentos: intentos + 1, message: msg }
      }));
      return false;
    }
  },
  setTargetElement: (z: number, a: number) => set((state) => ({
    particulas: { ...state.particulas, targetZ: z, targetA: a, targetCharge: 0, intentos: 0, estrellas: 3 }
  })),
  setTargetCharge: (charge: number) => set((state) => ({
    particulas: { ...state.particulas, targetCharge: charge, intentos: 0, estrellas: 3 }
  })),
  resetParticulas: () => set((state) => ({ 
    particulas: { 
      ...state.particulas,
      protones: 0, neutrones: 0, electrones: 0, 
      isStable: true, message: "", intentos: 0, estrellas: 3 
    } 
  })),
  updateGases: (t: number, v: number, n?: number) => set((state) => {
    if (state.gases.isExploded) return state;
    const R = 0.08206;
    const currentN = n !== undefined ? n : state.gases.n;
    const safeV = Math.max(0.1, v); // Protección división por cero
    const computedP = (currentN * R * t) / safeV;
    const willExplode = computedP > 7.0;
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
    const { P, pTarget, isExploded } = get().gases;
    const isOk = !isExploded && Math.abs(P - pTarget) < 0.1;
    set((state) => ({ gases: { ...state.gases, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetGases: () => set((state) => ({ 
    gases: { 
      ...state.gases, 
      missionId: 'sandbox',
      T: 300, V: 10, P: 1.0, n: 0.406, isExploded: false, pTarget: 3.5,
      gasType: 'He', mw: 4.002,
      status: 'idle'
    },
    bitacoraData: { ...state.bitacoraData, gases_logs: [] }
  })),
  setGasesMission: (missionId: 'sandbox' | 'boyle' | 'charles' | 'gaylussac' | 'avogadro') => set((state) => {
    let T = 300, V = 10, n = 0.406, pTarget = 3.5;
    const R = 0.08206;

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
  // --- SCIENTIFIC BALANCER ENGINE (Diamond State Edition) ---
  setCoeficiente: (index: number, value: number) => set((state) => {
    const b = state.balanceo || {};
    const reactions = b.reacciones || REACCIONES_BALANCEO;
    const reac = reactions[b.reaccionActual || 0] || reactions[0];
    if (!reac) return state;

    const nCoef = [...(b.coeficientes || Array(reac.reactivos.length + reac.productos.length).fill(1))];
    nCoef[index] = Math.max(1, value);

    const rAtoms: Record<string, number> = {};
    const pAtoms: Record<string, number> = {};
    let totalMassR = 0;
    let totalMassP = 0;

    // Reactivos: Átomos y Masa
    reac.reactivos.forEach((mol: any, i: number) => {
      const coef = nCoef[i];
      Object.entries(mol.atomos).forEach(([sym, count]: [string, any]) => {
        rAtoms[sym] = (rAtoms[sym] || 0) + (count * coef);
      });
      totalMassR += mol.molar * coef;
    });

    // Productos: Átomos y Masa
    reac.productos.forEach((mol: any, i: number) => {
      const coef = nCoef[reac.reactivos.length + i];
      Object.entries(mol.atomos).forEach(([sym, count]: [string, any]) => {
        pAtoms[sym] = (pAtoms[sym] || 0) + (count * coef);
      });
      totalMassP += mol.molar * coef;
    });

    const syms = new Set([...Object.keys(rAtoms), ...Object.keys(pAtoms)]);
    const isBalanced = Array.from(syms).every(s => rAtoms[s] === pAtoms[s]);

    const nCompletadas = [...(b.reaccionesCompletadas || [])];
    if (isBalanced && !nCompletadas.includes(reac.id)) {
      nCompletadas.push(reac.id);
    }

    return { 
      balanceo: { 
        ...b, 
        reacciones: REACCIONES_BALANCEO,
        coeficientes: nCoef, 
        isBalanced,
        atomosReactivos: rAtoms,
        atomosProductos: pAtoms,
        masaReactivos: parseFloat(totalMassR.toFixed(3)),
        masaProductos: parseFloat(totalMassP.toFixed(3)),
        reaccionesCompletadas: nCompletadas
      } 
    };
  }),
  setReaccion: (index: number) => set((state) => {
    const b = state.balanceo || {};
    const reactions = REACCIONES_BALANCEO;
    if (index > 0) {
      const prevReac = reactions[index - 1];
      const isPrevCompleted = b.reaccionesCompletadas?.includes(prevReac.id);
      if (!isPrevCompleted) return state; // Bloqueado
    }

    const reac = reactions[index] || reactions[0];
    const size = reac.reactivos.length + reac.productos.length;
    const initialCoefs = Array(size).fill(1);
    
    // Cálculo inicial de masa y ATOMOS
    const rAtoms: Record<string, number> = {};
    const pAtoms: Record<string, number> = {};
    let mR = 0, mP = 0;

    reac.reactivos.forEach((m: any, i: number) => {
      mR += m.molar;
      Object.entries(m.atomos).forEach(([sym, count]: [string, any]) => {
        rAtoms[sym] = (rAtoms[sym] || 0) + count;
      });
    });
    reac.productos.forEach((m: any, i: number) => {
      mP += m.molar;
      Object.entries(m.atomos).forEach(([sym, count]: [string, any]) => {
        pAtoms[sym] = (pAtoms[sym] || 0) + count;
      });
    });

    return { 
      balanceo: { 
        ...b, 
        reacciones: reactions,
        reaccionActual: index, 
        coeficientes: initialCoefs, 
        isBalanced: false,
        atomosReactivos: rAtoms,
        atomosProductos: pAtoms,
        masaReactivos: parseFloat(mR.toFixed(3)),
        masaProductos: parseFloat(mP.toFixed(3))
      } 
    };
  }),
  resetBalanceo: () => set((state) => {
    const b = state.balanceo || {};
    const reactions = b.reacciones || REACCIONES_BALANCEO;
    const reac = reactions[b.reaccionActual || 0] || reactions[0];
    const size = reac.reactivos.length + reac.productos.length;

    let mR = 0, mP = 0;
    reac.reactivos.forEach((m: any) => mR += m.molar);
    reac.productos.forEach((m: any) => mP += m.molar);

    return { 
      balanceo: { 
        ...b, 
        reacciones: REACCIONES_BALANCEO,
        coeficientes: Array(size).fill(1), 
        isBalanced: false,
        masaReactivos: parseFloat(mR.toFixed(3)),
        masaProductos: parseFloat(mP.toFixed(3))
      } 
    };
  }),
  validarQ3: () => {
    const { balanceo } = get();
    // Se considera éxito si ha completado al menos 4 de las 6 reacciones disponibles
    const isOk = (balanceo.reaccionesCompletadas?.length || 0) >= 4;
    return isOk;
  },
  setReaccionLimitante: (index: number) => set((state) => {
    const r = REACCIONES_LIMITANTE[index] || REACCIONES_LIMITANTE[0];
    return { 
      limitante: { 
        ...state.limitante, 
        reaccionActual: index, 
        inputMasses: [0, 0],
        targetYield: parseFloat((10 + Math.random() * 40).toFixed(1)),
        results: { moles: [0, 0], limitingIdx: -1, theoreticalYield: 0, excessMass: 0 },
        isRunning: false, status: 'idle' 
      } 
    };
  }),
  setInputMass: (idx: number, mass: number) => set((state) => {
    const l = state.limitante || {};
    const actIdx = l.reaccionActual ?? 0;
    const reac = REACCIONES_LIMITANTE[actIdx];
    const newMasses = [...(l.inputMasses || [0, 0])];
    newMasses[idx] = Math.max(0, mass);

    // Cálculos Estequiométricos
    const moles = newMasses.map((m, i) => m / (reac.reactivos[i]?.molar || 1));
    
    // Identificar limitante: moles / coeficiente
    const ratios = moles.map((n, i) => n / (reac.reactivos[i]?.coef || 1));
    const limitingIdx = ratios[0] < ratios[1] ? 0 : 1;
    const excessIdx = limitingIdx === 0 ? 1 : 0;

    // Rendimiento Teórico basado en el limitante
    const nLimitante = moles[limitingIdx];
    const nProduct = (nLimitante / reac.reactivos[limitingIdx].coef) * reac.productos[0].coef;
    const theoreticalYield = nProduct * reac.productos[0].molar;

    // Exceso consumido
    const nExcessNeeded = (nLimitante / reac.reactivos[limitingIdx].coef) * reac.reactivos[excessIdx].coef;
    const excessMass = (moles[excessIdx] - nExcessNeeded) * reac.reactivos[excessIdx].molar;

    return {
      limitante: {
        ...l,
        inputMasses: newMasses,
        results: {
          moles: moles.map(n => parseFloat(n.toFixed(4))),
          limitingIdx,
          theoreticalYield: parseFloat(theoreticalYield.toFixed(3)),
          excessMass: parseFloat(Math.max(0, excessMass).toFixed(3))
        }
      }
    };
  }),
  generarSemillaP4: () => set((state) => {
    const l = state.limitante || {};
    const actIdx = l.reaccionActual ?? 0;
    const reac = REACCIONES_LIMITANTE[actIdx];
    
    // Generamos masas aleatorias coherentes
    const m1 = 10 + Math.random() * 90;
    const m2 = 10 + Math.random() * 90;
    
    const moles = [m1 / (reac.reactivos[0]?.molar || 1), m2 / (reac.reactivos[1]?.molar || 1)];
    const ratios = moles.map((n, i) => n / (reac.reactivos[i]?.coef || 1));
    const limitingIdx = ratios[0] < ratios[1] ? 0 : 1;
    const excessIdx = limitingIdx === 0 ? 1 : 0;
    const nLimitante = moles[limitingIdx];
    const nProduct = (nLimitante / reac.reactivos[limitingIdx].coef) * reac.productos[0].coef;
    const theoreticalYield = nProduct * reac.productos[0].molar;
    const nExcessNeeded = (nLimitante / reac.reactivos[limitingIdx].coef) * reac.reactivos[excessIdx].coef;
    const excessMass = (moles[excessIdx] - nExcessNeeded) * reac.reactivos[excessIdx].molar;

    return { 
      limitante: { 
        ...l, 
        reacciones: REACCIONES_LIMITANTE, // Restaurar si faltaba
        reaccionActual: actIdx,
        inputMasses: [m1, m2],
        results: {
          moles: moles.map(n => parseFloat(n.toFixed(4))),
          limitingIdx,
          theoreticalYield: parseFloat(theoreticalYield.toFixed(3)),
          excessMass: parseFloat(Math.max(0, excessMass).toFixed(3))
        },
        status: 'idle',
        isRunning: false
      } 
    };
  }),
  validarP4: (ansLimitanteIdx: number, ansExceso: number) => {
    const { results = { limitingIdx: -1, excessMass: 0 } } = get().limitante || {};
    const isOk = (ansLimitanteIdx === results.limitingIdx) && (Math.abs(ansExceso - (results.excessMass || 0)) < 0.1);
    set((state) => ({ limitante: { ...state.limitante, status: isOk ? 'success' : 'error', isRunning: isOk } }));
    return isOk;
  },
  resetP4: () => set((state) => ({ limitante: { ...state.limitante, isRunning: false, status: 'idle' } })),
  generarSemillaP5: () => set((state) => {
    const s = state.soluciones || {};
    const purity = s.sal?.purity || 0.985;
    const pm = s.sal?.pm || 58.443;
    const mTarget = parseFloat((0.1 + Math.random() * 0.9).toFixed(2)), vTarget = [100, 250, 500][Math.floor(Math.random() * 3)];
    // Masa Teórica / Pureza = Masa que el alumno REALMENTE debe pesar
    const mRequerida = parseFloat(((mTarget * (vTarget / 1000) * pm) / purity).toFixed(3));
    return { soluciones: { ...s, mTarget, vTarget, mRequerida, status: 'idle' }, bitacoraData: { ...state.bitacoraData, mTarget, vTarget, mReq: mRequerida } };
  }),
  addPolvo: (amount: number) => set((state) => {
    if (!state.soluciones.balanza.encendida) return state;
    return { soluciones: { ...state.soluciones, balanza: { ...state.soluciones.balanza, polvo: state.soluciones.balanza.polvo + amount } } };
  }),
  toggleTara: () => set((state) => ({ soluciones: { ...state.soluciones, balanza: { ...state.soluciones.balanza, tara: !state.soluciones.balanza.tara } } })),
  transferirPolvo: () => set((state) => ({ soluciones: { ...state.soluciones, matraz: { ...state.soluciones.matraz, polvo: state.soluciones.balanza.polvo }, balanza: { ...state.soluciones.balanza, polvo: 0 }, status: 'transferred' } })),
  setAgua: (amount: number) => set((state) => ({ soluciones: { ...state.soluciones, matraz: { ...state.soluciones.matraz, agua: amount } } })),
  setHolding: (item: string | null) => set((state) => ({ soluciones: { ...state.soluciones, interaccion: { ...(state.soluciones.interaccion || { holding: null, jarraAbierta: false }), holding: item } } })),
  toggleJar: () => set((state) => ({ soluciones: { ...state.soluciones, interaccion: { ...(state.soluciones.interaccion || { holding: null, jarraAbierta: false }), jarraAbierta: !state.soluciones.interaccion?.jarraAbierta } } })),
  validarP5: () => {
    const { soluciones } = get();
    const pm = soluciones.sal?.pm || 58.443;
    const purity = soluciones.sal?.purity || 1.0;
    const safeAgua = Math.max(1, soluciones.matraz.agua); // Protección división por cero
    
    // Masa Real = Masa pesada * Pureza
    const masaEfectiva = soluciones.matraz.polvo * purity;
    const mActual = (masaEfectiva / pm) / (safeAgua / 1000);
    const isOk = Math.abs(mActual - soluciones.mTarget) < 0.05;
    if (isOk) {
      get().registrarHallazgo('preparacion_soluciones', {
        sustancia: soluciones.sal?.nombre,
        m_objetivo: soluciones.mTarget,
        m_lograda: parseFloat(mActual.toFixed(4)),
        v_total: soluciones.vTarget,
        masa_pesada: soluciones.matraz.polvo,
        precision: parseFloat((100 - Math.abs((mActual - soluciones.mTarget) / soluciones.mTarget) * 100).toFixed(2))
      });
    }
    set((state) => ({ soluciones: { ...state.soluciones, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP5: () => set((state) => ({ soluciones: { ...state.soluciones, matraz: { polvo: 0, agua: 0 }, status: 'idle' } })),
  setUbicacionVaso: (loc: 'mesa' | 'parrilla' | 'hielo') => set((state) => ({ solubilidad: { ...state.solubilidad, ubicacion: loc } })),
  setSustanciaSolubilidad: (idx: number) => set((state) => ({ 
    solubilidad: { 
      ...state.solubilidad, 
      sustanciaIdx: idx, 
      salAgregada: 0, 
      temp: 20, 
      status: 'idle' 
    } 
  })),
  addSalSolubilidad: (amount: number) => set((state) => ({ solubilidad: { ...state.solubilidad, salAgregada: state.solubilidad.salAgregada + amount } })),
  updateTemperaturaP6: (dt: number) => set((state) => {
    let newTemp = state.solubilidad.temp;
    if (state.solubilidad.ubicacion === 'parrilla') newTemp = Math.min(100, newTemp + dt);
    else if (state.solubilidad.ubicacion === 'hielo') newTemp = Math.max(0, newTemp - dt * 2.5);
    return { solubilidad: { ...state.solubilidad, temp: newTemp } };
  }),
  validarP6: () => {
    const { temp, salAgregada, sustancias, sustanciaIdx } = get().solubilidad;
    const s = sustancias[sustanciaIdx];
    const solubility = s.a * Math.exp(s.b * temp);
    // Para validar éxito, debe estar sobresaturada (más sal de la que cabe)
    const isOk = salAgregada > solubility;
    if (isOk) {
      get().registrarHallazgo('solubilidad_cristalizacion', {
        sustancia: s.nombre,
        temperatura: temp,
        masa_agregada: salAgregada,
        limite_solubilidad: solubility,
        condicion: 'sobresaturada'
      });
    }
    set((state) => ({ solubilidad: { ...state.solubilidad, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetP6: () => set((state) => ({ solubilidad: { ...state.solubilidad, temp: 20, salAgregada: 0, ubicacion: 'mesa', status: 'idle' } })),
  generarSemillaP7: () => set((state) => {
    const ca = parseFloat((0.05 + Math.random() * 0.15).toFixed(3)), cb = 0.1, va = 25;
    return { titulacion: { ...state.titulacion, ca, cb, va, volumenBase: 0, status: 'idle', history: [] } };
  }),
  addDropNaOH: (amount: number) => set((state) => {
    const newVol = state.titulacion.volumenBase + amount;
    
    // Lógica logarítmica de pH (Aproximación de titulación Ácido Fuerte / Base Fuerte)
    const nA = state.titulacion.ca * (state.titulacion.va / 1000);
    const nB = state.titulacion.cb * (newVol / 1000);
    const vTotal = (state.titulacion.va + newVol) / 1000;
    
    let ph = 7;
    if (nA > nB) {
      const concH = (nA - nB) / vTotal;
      ph = -Math.log10(concH);
    } else if (nB > nA) {
      const concOH = (nB - nA) / vTotal;
      const pOH = -Math.log10(concOH);
      ph = 14 - pOH;
    }
    
    return { titulacion: { ...state.titulacion, volumenBase: newVol, history: [...state.titulacion.history, { vol: newVol, ph: parseFloat(ph.toFixed(2)) }].slice(-50) } };
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
  generarSemillaP8: () => set((state) => ({ equilibrio: { jeringas: [{ id: 1, ubicacion: 'mesa', temp: 20 }, { id: 2, ubicacion: 'mesa', temp: 20 }, { id: 3, ubicacion: 'mesa', temp: 20 }], status: 'idle' } })),
  autoResolveP8: () => {},
  generarSemillaP9: () => set((state) => {
    const metals = ['Zn', 'Cu', 'Ag', 'Mg'], shuffled = [...metals].sort(() => Math.random() - 0.5);
    return { celda: { ...state.celda, seedMetales: shuffled.slice(0, 2), vasoIzq: null, vasoDer: null, status: 'idle', puenteSalino: false, cablesConectados: false, voltaje: 0 } };
  }),

  setMetalVaso: (vaso: 'izq' | 'der', metal: string | null) => set((state) => {
    const nCelda = { ...state.celda, [vaso === 'izq' ? 'vasoIzq' : 'vasoDer']: metal };
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

  validarP9: (anodo: string, catodo: string, v: number) => {
    const { vasoIzq, vasoDer, voltaje } = get().celda;
    const isOk = vasoIzq === anodo && vasoDer === catodo && Math.abs(v - voltaje) < 0.05;
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
  validarP10: (pureza: number) => {
    const isOk = get().destilacion.volDestilado > 50 && Math.abs(pureza - 95) < 5;
    set((state) => ({ destilacion: { ...state.destilacion, status: isOk ? 'success' : 'error', purezaDestilado: pureza } }));
    return isOk;
  },
  resetP10: () => set((state) => ({ destilacion: { calorManta: 20, tempMezcla: 20, volEtanolMatraz: 100, volAguaMatraz: 100, volDestilado: 0, purezaDestilado: 0, status: 'idle' } })),
});

// Helper de cálculo Electroquímico (Fuera del slice)
const calculateVoltaje = (celda: any) => {
  if (!celda.vasoIzq || !celda.vasoDer || !celda.puenteSalino || !celda.cablesConectados) return 0;
  const pots: Record<string, number> = { Zn: -0.76, Cu: 0.34, Ag: 0.80, Mg: -2.37 };
  // E_celda = E_catodo (Der) - E_anodo (Izq)
  const eIzq = pots[celda.vasoIzq];
  const eDer = pots[celda.vasoDer];
  return parseFloat((eDer - eIzq).toFixed(2));
};
