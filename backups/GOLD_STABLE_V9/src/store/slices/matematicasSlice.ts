import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';

export const createMatematicasSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  cuadraticas: { a: 1, b: 0, c: 0, target: { a: 2, b: -2, c: -3 }, status: 'idle' },
  sistemas2x2: { m1: 1, b1: 5, m2: -1, b2: -5, target: { x: 5, y: 0 }, status: 'idle' },
  richter: { magnitudBase: 6.0, magnitudActual: 6.0, targetM: 8.0, userInputFactor: '', isLogView: false, status: 'idle' },
  pitagoras: { catetoA: 3, catetoB: 4, llenado: 0, userInputC: '', status: 'idle' },
  trigonometria: { angulo: 0, animando: false, verSeno: true, verCoseno: false, status: 'idle' },
  geometria6: { tx: 0, ty: 0, rotacion: 0, escala: 1.0, target: { tx: 5, ty: 5, rotacion: 90, escala: 2.0 }, status: 'idle' },
  optica7: { n1: 1.0, n2: 'misterio', n2Misterio: 1.5, anguloIncidencia: 45, userInputN2: '', status: 'idle' },
  derivada8: { xActual: 0, mostrarDerivada: false, status: 'idle' },
  integral9: { n: 4, metodo: 'izquierda', animandoLimite: false, status: 'idle' },
  galton10: { poblacion: 100, probabilidad: 0.50, simulando: false, contenedores: new Array(11).fill(0), status: 'idle' },

  setCoefsM1: (a: number, b: number, c: number) => set((state) => ({ cuadraticas: { ...state.cuadraticas, a, b, c } })),
  generarSemillaM1: () => set((state) => {
    const a = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 2.5);
    const b = Math.floor(Math.random() * 11) - 5;
    const c = Math.floor(Math.random() * 11) - 5;
    return { cuadraticas: { ...state.cuadraticas, target: { a: parseFloat(a.toFixed(1)), b, c }, status: 'idle', a: 1, b: 0, c: 0 } };
  }),
  validarM1: () => {
    const { a, b, c, target } = get().cuadraticas;
    const isOk = Math.abs(a - target.a) < 0.15 && Math.abs(b - target.b) < 0.3 && Math.abs(c - target.c) < 0.3;
    set((state) => ({ cuadraticas: { ...state.cuadraticas, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM1: () => set((state) => ({ cuadraticas: { ...state.cuadraticas, a: 1, b: 0, c: 0, status: 'idle' } })),
  setSistemasCoefsM2: (m1: number, b1: number, m2: number, b2: number) => set((state) => ({ sistemas2x2: { ...state.sistemas2x2, m1, b1, m2, b2 } })),
  generarSemillaM2: () => set((state) => {
    const tx = Math.floor(Math.random() * 17) - 8, ty = Math.floor(Math.random() * 17) - 8;
    return { sistemas2x2: { ...state.sistemas2x2, target: { x: tx, y: ty }, status: 'idle', m1: 1, b1: 5, m2: -1, b2: -5 } };
  }),
  validarM2: () => {
    const { m1, b1, m2, b2, target } = get().sistemas2x2;
    if (Math.abs(m1 - m2) < 0.001) return false;
    const xi = (b2 - b1) / (m1 - m2), yi = m1 * xi + b1;
    const isOk = Math.abs(xi - target.x) < 0.1 && Math.abs(yi - target.y) < 0.1;
    set((state) => ({ sistemas2x2: { ...state.sistemas2x2, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM2: () => set((state) => ({ sistemas2x2: { ...state.sistemas2x2, m1: 1, b1: 5, m2: -1, b2: -5, status: 'idle' } })),
  setMagnitudM3: (m: number) => set((state) => ({ richter: { ...state.richter, magnitudActual: m } })),
  setUserInputM3: (val: string) => set((state) => ({ richter: { ...state.richter, userInputFactor: val } })),
  toggleLogViewM3: () => set((state) => ({ richter: { ...state.richter, isLogView: !state.richter.isLogView } })),
  generarSemillaM3: () => set((state) => {
    const target = parseFloat((7.5 + Math.random() * 2.0).toFixed(1));
    return { richter: { ...state.richter, targetM: target, status: 'idle', magnitudActual: 6.0, userInputFactor: '' } };
  }),
  validarM3: () => {
    const { targetM, magnitudBase, userInputFactor } = get().richter;
    const realFactor = Math.pow(10, 1.5 * (targetM - magnitudBase)), userVal = parseFloat(userInputFactor);
    const isOk = Math.abs(userVal - realFactor) / realFactor < 0.05;
    set((state) => ({ richter: { ...state.richter, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM3: () => set((state) => ({ richter: { ...state.richter, magnitudActual: 6.0, userInputFactor: '', status: 'idle' } })),
  setCatetosM4: (a: number, b: number) => set((state) => ({ pitagoras: { ...state.pitagoras, catetoA: a, catetoB: b, llenado: 0, status: 'idle' } })),
  setLlenadoM4: (val: number) => set((state) => ({ pitagoras: { ...state.pitagoras, llenado: val } })),
  setUserInputM4: (val: string) => set((state) => ({ pitagoras: { ...state.pitagoras, userInputC: val } })),
  validarM4: () => {
    const { catetoA, catetoB, userInputC } = get().pitagoras;
    const realC = Math.sqrt(catetoA * catetoA + catetoB * catetoB), userVal = parseFloat(userInputC);
    const isOk = Math.abs(userVal - realC) < 0.1;
    set((state) => ({ pitagoras: { ...state.pitagoras, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM4: () => set((state) => ({ pitagoras: { ...state.pitagoras, catetoA: 3, catetoB: 4, llenado: 0, userInputC: '', status: 'idle' } })),
  setAnguloM5: (a: number) => set((state) => ({ trigonometria: { ...state.trigonometria, angulo: a } })),
  setAnimandoM5: (val: boolean) => set((state) => ({ trigonometria: { ...state.trigonometria, animando: val } })),
  setTogglesM5: (s: boolean, c: boolean) => set((state) => ({ trigonometria: { ...state.trigonometria, verSeno: s, verCoseno: c } })),
  validarM5: () => {
    const { angulo } = get().trigonometria;
    const isOk = Math.abs(angulo - 45) <= 1 || Math.abs(angulo - 225) <= 1;
    set((state) => ({ trigonometria: { ...state.trigonometria, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM5: () => set((state) => ({ trigonometria: { angulo: 0, animando: false, verSeno: true, verCoseno: false, status: 'idle' } })),
  setTransformM6: (tx: number, ty: number, rot: number, s: number) => set((state) => ({ geometria6: { ...state.geometria6, tx, ty, rotacion: rot, escala: s } })),
  generarSemillaM6: () => set((state) => {
    const tx = Math.floor(Math.random() * 17) - 8, ty = Math.floor(Math.random() * 17) - 8;
    const rot = [0, 45, 90, 135, 180, 225, 270, 315][Math.floor(Math.random() * 8)], s = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0][Math.floor(Math.random() * 6)];
    return { geometria6: { ...state.geometria6, target: { tx, ty, rotacion: rot, escala: s }, status: 'idle', tx: 0, ty: 0, rotacion: 0, escala: 1.0 } };
  }),
  validarM6: () => {
    const { tx, ty, rotacion, escala, target } = get().geometria6;
    const isOk = tx === target.tx && ty === target.ty && rotacion === target.rotacion && escala === target.escala;
    set((state) => ({ geometria6: { ...state.geometria6, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM6: () => set((state) => ({ geometria6: { ...state.geometria6, tx: 0, ty: 0, rotacion: 0, escala: 1.0, status: 'idle' } })),
  setOpticaM7: (n1: number, n2: number | 'misterio', angulo: number) => set((state) => ({ optica7: { ...state.optica7, n1, n2, anguloIncidencia: angulo } })),
  setUserInputM7: (val: string) => set((state) => ({ optica7: { ...state.optica7, userInputN2: val } })),
  generarSemillaM7: () => set((state) => ({ optica7: { ...state.optica7, n2Misterio: parseFloat((1.4 + Math.random() * 0.6).toFixed(2)), status: 'idle', userInputN2: '' } })),
  validarM7: () => {
    const { userInputN2, n2Misterio } = get().optica7;
    const isOk = Math.abs(parseFloat(userInputN2) - n2Misterio) <= 0.05;
    set((state) => ({ optica7: { ...state.optica7, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM7: () => set((state) => ({ optica7: { ...state.optica7, n1: 1.0, n2: 'misterio', anguloIncidencia: 45, userInputN2: '', status: 'idle' } })),
  setXActualM8: (x: number) => set((state) => ({ derivada8: { ...state.derivada8, xActual: x } })),
  setMostrarDerivadaM8: (val: boolean) => set((state) => ({ derivada8: { ...state.derivada8, mostrarDerivada: val } })),
  validarM8: () => {
    const { xActual } = get().derivada8;
    const isOk = Math.abs(xActual * xActual - 4 * xActual + 3) <= 0.05;
    set((state) => ({ derivada8: { ...state.derivada8, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM8: () => set((state) => ({ derivada8: { xActual: 0, mostrarDerivada: false, status: 'idle' } })),
  setIntegralM9: (n: number, metodo: 'izquierda' | 'derecha' | 'punto_medio') => set((state) => ({ integral9: { ...state.integral9, n, metodo } })),
  setAnimandoM9: (val: boolean) => set((state) => ({ integral9: { ...state.integral9, animandoLimite: val } })),
  validarM9: (err: number) => {
    const isOk = err < 0.5;
    set((state) => ({ integral9: { ...state.integral9, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM9: () => set((state) => ({ integral9: { n: 4, metodo: 'izquierda', animandoLimite: false, status: 'idle' } })),
  setGaltonM10: (poblacion: number, probabilidad: number) => set((state) => ({ galton10: { ...state.galton10, poblacion, probabilidad } })),
  setSimulandoM10: (val: boolean) => set((state) => ({ galton10: { ...state.galton10, simulando: val } })),
  lanzarBolitasM10: () => {
    const { poblacion, probabilidad, contenedores } = get().galton10;
    const nuevosContenedores = [...contenedores];
    for (let i = 0; i < poblacion; i++) {
      let pos = 0;
      for (let row = 0; row < 10; row++) if (Math.random() < probabilidad) pos++;
      nuevosContenedores[pos]++;
    }
    set((state) => ({ galton10: { ...state.galton10, contenedores: nuevosContenedores } }));
  },
  vaciarGaltonM10: () => set((state) => ({ galton10: { ...state.galton10, contenedores: new Array(11).fill(0), status: 'idle' } })),
  validarM10: () => {
    const { probabilidad, contenedores } = get().galton10;
    const isOk = Math.abs(probabilidad - 0.5) < 0.05 && contenedores.reduce((a, b) => a + b, 0) >= 200;
    set((state) => ({ galton10: { ...state.galton10, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM10: () => set((state) => ({ galton10: { poblacion: 100, probabilidad: 0.50, simulando: false, contenedores: new Array(11).fill(0), status: 'idle' } })),
});
