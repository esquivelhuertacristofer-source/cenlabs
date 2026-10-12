import { StateCreator } from 'zustand';
import { SimuladorState, MatematicasSlice } from '../types';
import * as MatDomain from '@/domain/matematicas';

// randomUUID solo existe en contextos seguros (https/localhost) y no en jsdom.
const nuevoId = () => globalThis.crypto?.randomUUID?.() ?? `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const azar = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const enteroEntre = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** Pendiente y ordenadas iniciales de M2: se cortan en (−5, 0). */
const RECTAS_INICIALES_M2 = { m1: 1, b1: 5, m2: -1, b2: -5 };
/** Coeficiente m del cohete M8: t* = m / (3k) cae en 4, 4.5, 5, 5.5 o 6 s. */
const COHETES_M8 = [1.2, 1.35, 1.5, 1.65, 1.8];
const P_GALTON_M10 = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];

export const createMatematicasSlice: StateCreator<SimuladorState, [], [], MatematicasSlice> = (set, get) => ({
  cuadraticas: {
    a: 1, b: 0, c: 0,
    target: { a: 2, b: -2, c: -3 },
    status: 'idle',
    intentos: 0,
    estrellas: 3,
    hallazgos: [],
    mensajeFeedback: '',
    deltaVerified: false,
    vertexVerified: false,
    escenario: 'parabola_basica'
  },
  sistemas2x2: { ...RECTAS_INICIALES_M2, target: { x: 5, y: 0 }, status: 'idle', escenario: 'rastreo_satelital' },
  richter: { magnitudBase: 6.0, magnitudActual: 6.0, targetM: 8.0, userInputFactor: '', isLogView: false, status: 'idle', escenario: 'simulacion_libre' },
  pitagoras: { catetoA: 3, catetoB: 4, llenado: 0, userInputC: '', status: 'idle', escenario: 'pitagoras_basico' },
  trigonometria: { angulo: 0, animando: false, verSeno: true, verCoseno: false, status: 'idle', hallazgos: [], objetivo: { funcion: 'sen', valor: 0.5, texto: '1/2' } },
  geometria6: { tx: 0, ty: 0, rotacion: 0, escala: 1.0, target: { tx: 3, ty: -2, rotacion: 90, escala: 1.5 }, status: 'idle' },
  optica7: { n1: 1.0, n2: 'misterio', n2Misterio: 1.5, anguloIncidencia: 45, userInputN2: '', status: 'idle' },
  derivada8: { xActual: 0, k: 0.1, m: 1.5, mostrarDerivada: false, status: 'idle' },
  integral9: { n: 4, metodo: 'izquierda', metodoReto: 'izquierda', animandoLimite: false, status: 'idle' },
  galton10: { poblacion: 100, probabilidad: 0.50, simulando: false, contenedores: new Array(11).fill(0), bolitasPendientes: 0, status: 'idle', prediccionMedia: '', prediccionSigma: '' },

  // ── M1 ─────────────────────────────────────────────────────────────────────
  setCoefsM1: (a: number, b: number, c: number) => set((state) => ({ cuadraticas: { ...state.cuadraticas, a, b, c, status: 'idle' } })),
  generarSemillaM1: () => set((state) => {
    const escenarios: Array<'lanzamiento_proyectil' | 'arquitectura_arco' | 'focalizacion_antena'> = ['lanzamiento_proyectil', 'arquitectura_arco', 'focalizacion_antena'];
    // a en décimas (±0.5…±3.0, dentro del slider de paso 0.1); b, c enteros (slider de paso 0.5).
    // Se descarta el objetivo que ya coincidiría con la parábola inicial y = x².
    let target: { a: number; b: number; c: number };
    do {
      target = { a: (Math.random() > 0.5 ? 1 : -1) * enteroEntre(5, 30) / 10, b: enteroEntre(-5, 5), c: enteroEntre(-5, 5) };
    } while (MatDomain.validarM1({ a: 1, b: 0, c: 0, target }));
    return { cuadraticas: { ...state.cuadraticas, target, status: 'idle', a: 1, b: 0, c: 0, mensajeFeedback: '', deltaVerified: false, vertexVerified: false, escenario: azar(escenarios) } };
  }),
  validarM1: () => {
    const cuadraticas = get().cuadraticas;
    // Además de deducir a, b y c, la práctica pide comprobar en la bitácora el
    // discriminante y el vértice (consola de cálculo, que SÍ verifica el número).
    const calculos = (cuadraticas.deltaVerified ?? false) && (cuadraticas.vertexVerified ?? false);
    const isOk = calculos && MatDomain.validarM1(cuadraticas);
    if (isOk) {
      const newEstrellas = cuadraticas.intentos <= 1 ? 3 : cuadraticas.intentos <= 3 ? 2 : 1;
      set((state) => ({
        cuadraticas: { ...state.cuadraticas, status: 'success', estrellas: newEstrellas, mensajeFeedback: 'Trayectoria deducida: tu parábola pasa por los tres puntos medidos.' }
      }));
    } else {
      set((state) => ({
        cuadraticas: {
          ...state.cuadraticas, status: 'error', intentos: cuadraticas.intentos + 1,
          mensajeFeedback: calculos ? MatDomain.feedbackM1(cuadraticas) : 'Antes de validar, comprueba en la bitácora el discriminante Δ y el vértice h de tu parábola.',
        }
      }));
    }
    return isOk;
  },
  registrarHallazgoM1: () => {
    const { a, b, c } = get().cuadraticas;
    const h = -b / (2 * (a || 0.001));
    const k = a * h * h + b * h + c;
    const delta = b * b - 4 * a * c;

    const newHallazgo = {
      id: nuevoId(),
      eq: `f(x) = ${a}x² ${b>=0?'+':''}${b}x ${c>=0?'+':''}${c}`,
      delta,
      h,
      k,
      timestamp: new Date().toLocaleTimeString()
    };

    set((state) => ({
      cuadraticas: {
        ...state.cuadraticas,
        hallazgos: [newHallazgo, ...state.cuadraticas.hallazgos].slice(0, 10)
      }
    }));
    get().registrarHallazgo('mat_cuadraticas', { eq: newHallazgo.eq, delta, h: newHallazgo.h, k: newHallazgo.k });
  },
  resetM1: () => set((state) => ({
    cuadraticas: { ...state.cuadraticas, a: 1, b: 0, c: 0, status: 'idle', intentos: 0, estrellas: 3, mensajeFeedback: '', deltaVerified: false, vertexVerified: false }
  })),
  setDeltaVerified: (v: boolean) => set((state) => ({ cuadraticas: { ...state.cuadraticas, deltaVerified: v } })),
  setVertexVerified: (v: boolean) => set((state) => ({ cuadraticas: { ...state.cuadraticas, vertexVerified: v } })),

  // ── M2 ─────────────────────────────────────────────────────────────────────
  setSistemasCoefsM2: (m1: number, b1: number, m2: number, b2: number) => set((state) => ({ sistemas2x2: { ...state.sistemas2x2, m1, b1, m2, b2, status: 'idle' } })),
  generarSemillaM2: () => set((state) => {
    const escenarios: Array<'rastreo_satelital' | 'interseccion_rutas' | 'triangulacion_torres'> = ['rastreo_satelital', 'interseccion_rutas', 'triangulacion_torres'];
    // Objetivo entero en [−8, 8]²; se descarta (−5, 0), donde ya se cortan las rectas iniciales.
    let target: { x: number; y: number };
    do { target = { x: enteroEntre(-8, 8), y: enteroEntre(-8, 8) }; }
    while (MatDomain.validarM2({ ...RECTAS_INICIALES_M2, target }).isOk);
    return { sistemas2x2: { ...state.sistemas2x2, ...RECTAS_INICIALES_M2, target, status: 'idle', escenario: azar(escenarios) } };
  }),
  validarM2: () => {
    const result = MatDomain.validarM2(get().sistemas2x2);
    if (result.isOk) {
      const { m1, b1, m2, b2, target } = get().sistemas2x2;
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_sistemas_interseccion', {
        m1, b1, m2, b2,
        interseccion_teorica: { x: target.x, y: target.y },
        interseccion_real: result.interseccion,
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ sistemas2x2: { ...state.sistemas2x2, status: result.isOk ? 'success' : 'error' } }));
    return result.isOk;
  },
  resetM2: () => set((state) => ({ sistemas2x2: { ...state.sistemas2x2, ...RECTAS_INICIALES_M2, status: 'idle' } })),

  // ── M3 ─────────────────────────────────────────────────────────────────────
  setMagnitudM3: (m: number) => set((state) => ({ richter: { ...state.richter, magnitudActual: m } })),
  setUserInputM3: (val: string) => set((state) => ({ richter: { ...state.richter, userInputFactor: val, status: 'idle' } })),
  toggleLogViewM3: () => set((state) => ({ richter: { ...state.richter, isLogView: !state.richter.isLogView } })),
  generarSemillaM3: () => set((state) => {
    const esc = azar(MatDomain.SISMOS_M3);
    return { richter: { ...state.richter, targetM: esc.target, status: 'idle', magnitudActual: state.richter.magnitudBase, userInputFactor: '', escenario: esc.id } };
  }),
  validarM3: () => {
    const richter = get().richter;
    const isOk = MatDomain.validarM3(richter);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_richter_logaritmos', {
        magnitud_base: richter.magnitudBase,
        magnitud_target: richter.targetM,
        factor_energia_real: MatDomain.factorEnergiaM3(richter.targetM, richter.magnitudBase),
        factor_alumno: MatDomain.leerNumero(richter.userInputFactor),
        escenario: richter.escenario,
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ richter: { ...state.richter, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM3: () => set((state) => ({ richter: { ...state.richter, magnitudActual: state.richter.magnitudBase, userInputFactor: '', isLogView: false, status: 'idle' } })),

  // ── M4 ─────────────────────────────────────────────────────────────────────
  setCatetosM4: (a: number, b: number) => set((state) => ({ pitagoras: { ...state.pitagoras, catetoA: a, catetoB: b, llenado: 0, status: 'idle' } })),
  setLlenadoM4: (val: number) => set((state) => ({ pitagoras: { ...state.pitagoras, llenado: val } })),
  setUserInputM4: (val: string) => set((state) => ({ pitagoras: { ...state.pitagoras, userInputC: val, status: 'idle' } })),
  generarSemillaM4: (forcedEsc?: 'pitagoras_basico' | 'diseno_rampas' | 'navegacion_maritima') => set((state) => {
    const escenarios: Array<'pitagoras_basico' | 'diseno_rampas' | 'navegacion_maritima'> = ['pitagoras_basico', 'diseno_rampas', 'navegacion_maritima'];
    // Catetos enteros DENTRO del rango del slider (1–10); la hipotenusa casi nunca es entera.
    const a = enteroEntre(2, MatDomain.CATETO_MAX_M4), b = enteroEntre(2, MatDomain.CATETO_MAX_M4);
    return { pitagoras: { ...state.pitagoras, catetoA: a, catetoB: b, llenado: 0, userInputC: '', status: 'idle', escenario: forcedEsc || azar(escenarios) } };
  }),
  validarM4: () => {
    const pitagoras = get().pitagoras;
    const isOk = MatDomain.validarM4(pitagoras);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_pitagoras_geometria', {
        cateto_a: pitagoras.catetoA,
        cateto_b: pitagoras.catetoB,
        hipotenusa_real: Math.hypot(pitagoras.catetoA, pitagoras.catetoB),
        hipotenusa_alumno: MatDomain.leerNumero(pitagoras.userInputC),
        escenario: pitagoras.escenario,
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ pitagoras: { ...state.pitagoras, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM4: () => set((state) => ({ pitagoras: { ...state.pitagoras, catetoA: 3, catetoB: 4, llenado: 0, userInputC: '', status: 'idle', escenario: 'pitagoras_basico' } })),

  // ── M5 ─────────────────────────────────────────────────────────────────────
  setAnguloM5: (a: number) => set((state) => ({ trigonometria: { ...state.trigonometria, angulo: a } })),
  setAnimandoM5: (val: boolean) => set((state) => ({ trigonometria: { ...state.trigonometria, animando: val } })),
  setTogglesM5: (s: boolean, c: boolean) => set((state) => ({ trigonometria: { ...state.trigonometria, verSeno: s, verCoseno: c } })),
  generarSemillaM5: () => set((state) => {
    const v = azar(MatDomain.VALORES_NOTABLES_M5);
    const funcion = azar(['sen', 'cos'] as const);
    return { trigonometria: { ...state.trigonometria, objetivo: { funcion, valor: v.valor, texto: v.texto }, hallazgos: [], status: 'idle' } };
  }),
  registrarHallazgoM5: () => set((state) => {
    const { angulo } = state.trigonometria;
    const rad = (angulo * Math.PI) / 180;
    const nuevo = {
        id: Date.now(),
        angulo,
        sin: Math.sin(rad),
        cos: Math.cos(rad)
    };
    // Evitar duplicados cercanos
    if (state.trigonometria.hallazgos?.some(h => Math.abs(h.angulo - angulo) < 1)) return state;
    return {
        trigonometria: {
            ...state.trigonometria,
            hallazgos: [...(state.trigonometria.hallazgos || []), nuevo].slice(-4),
            status: 'idle',
        }
    };
  }),
  limpiarHallazgosM5: () => set((state) => ({ trigonometria: { ...state.trigonometria, hallazgos: [], status: 'idle' } })),
  validarM5: () => {
    const trig = get().trigonometria;
    const isOk = MatDomain.validarM5(trig);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_trigonometria_fase', {
        ecuacion: `${trig.objetivo?.funcion} θ = ${trig.objetivo?.texto}`,
        angulos_capturados: (trig.hallazgos ?? []).map((h) => h.angulo),
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ trigonometria: { ...state.trigonometria, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  // Conserva la ecuación asignada: reiniciar no cambia el reto.
  resetM5: () => set((state) => ({ trigonometria: { angulo: 0, animando: false, verSeno: true, verCoseno: false, status: 'idle', hallazgos: [], objetivo: state.trigonometria.objetivo } })),

  // ── M6 ─────────────────────────────────────────────────────────────────────
  setTransformM6: (tx: number, ty: number, rot: number, s: number) => set((state) => ({ geometria6: { ...state.geometria6, tx, ty, rotacion: rot, escala: s, status: 'idle' } })),
  generarSemillaM6: () => set((state) => {
    // Todo dentro de los sliders: T enteras en [−5, 5], R múltiplo de 45°, S ∈ {0.5, 1, 1.5, 2}.
    // Se descarta un objetivo que ya coincidiría con la nave inicial (identidad).
    const ident = { tx: 0, ty: 0, rotacion: 0, escala: 1 };
    let target: { tx: number; ty: number; rotacion: number; escala: number };
    do {
      target = {
        tx: enteroEntre(-MatDomain.RANGO_T_M6, MatDomain.RANGO_T_M6),
        ty: enteroEntre(-MatDomain.RANGO_T_M6, MatDomain.RANGO_T_M6),
        rotacion: 45 * enteroEntre(0, 7),
        escala: azar([0.5, 1.0, 1.5, 2.0]),
      };
    } while (MatDomain.validarM6({ ...ident, target }));
    return { geometria6: { ...state.geometria6, ...ident, target, status: 'idle' } };
  }),
  validarM6: () => {
    const geo = get().geometria6;
    const isOk = MatDomain.validarM6(geo);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_geometria_transformacion', {
        traslacion: { x: geo.tx, y: geo.ty },
        rotacion: geo.rotacion,
        escala: geo.escala,
        target: geo.target,
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ geometria6: { ...state.geometria6, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM6: () => set((state) => ({ geometria6: { ...state.geometria6, tx: 0, ty: 0, rotacion: 0, escala: 1.0, status: 'idle' } })),

  // ── M7 ─────────────────────────────────────────────────────────────────────
  setOpticaM7: (n1: number, n2: number | 'misterio', angulo: number) => set((state) => ({ optica7: { ...state.optica7, n1, n2, anguloIncidencia: angulo } })),
  setAnguloM7: (angulo: number) => set((state) => ({
    optica7: { ...state.optica7, anguloIncidencia: Math.round(Math.min(MatDomain.ANGULO_MAX_M7, Math.max(MatDomain.ANGULO_MIN_M7, angulo))) },
  })),
  setUserInputM7: (val: string) => set((state) => ({ optica7: { ...state.optica7, userInputN2: val, status: 'idle' } })),
  generarSemillaM7: () => set((state) => ({ optica7: { ...state.optica7, n1: 1.0, n2: 'misterio', n2Misterio: parseFloat((1.4 + Math.random() * 0.6).toFixed(2)), anguloIncidencia: enteroEntre(15, 75), status: 'idle', userInputN2: '' } })),
  validarM7: () => {
    const optica = get().optica7;
    const isOk = MatDomain.validarM7(optica);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_optica_snell', {
        n1: optica.n1,
        n2_real: optica.n2Misterio,
        n2_alumno: MatDomain.leerNumero(optica.userInputN2),
        angulo_incidencia: optica.anguloIncidencia,
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ optica7: { ...state.optica7, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM7: () => set((state) => ({ optica7: { ...state.optica7, n1: 1.0, n2: 'misterio', anguloIncidencia: 45, userInputN2: '', status: 'idle' } })),

  // ── M8 ─────────────────────────────────────────────────────────────────────
  setXActualM8: (x: number) => set((state) => ({ derivada8: { ...state.derivada8, xActual: x, status: 'idle' } })),
  setMostrarDerivadaM8: (val: boolean) => set((state) => ({ derivada8: { ...state.derivada8, mostrarDerivada: val } })),
  setDerivada8: (data: Partial<SimuladorState['derivada8']>) => set((state) => ({ derivada8: { ...state.derivada8, ...data } })),
  generarSemillaM8: () => set((state) => ({ derivada8: { ...state.derivada8, k: 0.1, m: azar(COHETES_M8), xActual: 0, status: 'idle' } })),
  validarM8: () => {
    const derivada = get().derivada8;
    const isOk = MatDomain.validarM8(derivada);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_derivada_tangente', {
        funcion: `s(t) = -${derivada.k}t³ + ${derivada.m}t²`,
        t_velocidad_maxima: MatDomain.tVelocidadMaximaM8(derivada),
        t_alumno: derivada.xActual,
        velocidad_maxima: MatDomain.velocidadM8(derivada, derivada.xActual),
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ derivada8: { ...state.derivada8, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM8: () => set((state) => ({ derivada8: { ...state.derivada8, xActual: 0, mostrarDerivada: false, status: 'idle' } })),

  // ── M9 ─────────────────────────────────────────────────────────────────────
  setIntegralM9: (n: number, metodo: 'izquierda' | 'derecha' | 'punto_medio') => set((state) => ({
    integral9: { ...state.integral9, n: Math.round(Math.min(MatDomain.N_MAX_M9, Math.max(MatDomain.N_MIN_M9, n))), metodo, status: 'idle' },
  })),
  setAnimandoM9: (val: boolean) => set((state) => ({ integral9: { ...state.integral9, animandoLimite: val } })),
  generarSemillaM9: () => set((state) => ({ integral9: { ...state.integral9, metodoReto: azar(['izquierda', 'derecha', 'punto_medio'] as const), status: 'idle' } })),
  validarM9: () => {
    const i9 = get().integral9;
    const isOk = MatDomain.validarM9(i9);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      registrarHallazgo('mat_integral_riemann', {
        rectangulos_n: i9.n,
        metodo: i9.metodo,
        suma: MatDomain.sumaRiemannM9(i9.n, i9.metodo),
        integral_exacta: MatDomain.INTEGRAL_EXACTA_M9,
        error_relativo: MatDomain.errorRelativoM9(i9.n, i9.metodo),
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ integral9: { ...state.integral9, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  // Conserva el método del reto.
  resetM9: () => set((state) => ({ integral9: { n: 4, metodo: 'izquierda', metodoReto: state.integral9.metodoReto, animandoLimite: false, status: 'idle' } })),

  // ── M10 ────────────────────────────────────────────────────────────────────
  setGaltonM10: (poblacion: number, probabilidad: number) => set((state) => ({ galton10: { ...state.galton10, poblacion, probabilidad } })),
  setSimulandoM10: (val: boolean) => set((state) => ({ galton10: { ...state.galton10, simulando: val } })),
  lanzarBolitasM10: () => set((state) => ({
    galton10: { ...state.galton10, bolitasPendientes: state.galton10.bolitasPendientes + 100 }
  })),
  contarBolitaM10: (bin: number) => set((state) => {
    if (!(bin >= 0 && bin < state.galton10.contenedores.length)) return state;
    const nuevosContenedores = [...state.galton10.contenedores];
    nuevosContenedores[bin]++;
    return { galton10: { ...state.galton10, contenedores: nuevosContenedores } };
  }),
  setGalton10: (data: Partial<SimuladorState['galton10']>) => set((state) => ({ galton10: { ...state.galton10, ...data } })),
  // Cambiar p vacía la máquina: una muestra con dos p distintas no es ninguna binomial.
  setProbabilidadM10: (p: number) => set((state) => ({
    galton10: { ...state.galton10, probabilidad: p, contenedores: new Array(11).fill(0), bolitasPendientes: 0, status: 'idle' },
  })),
  setPrediccionM10: (media: string, sigma: string) => set((state) => ({ galton10: { ...state.galton10, prediccionMedia: media, prediccionSigma: sigma, status: 'idle' } })),
  generarSemillaM10: () => set((state) => ({
    galton10: { ...state.galton10, probabilidad: azar(P_GALTON_M10), contenedores: new Array(11).fill(0), bolitasPendientes: 0, prediccionMedia: '', prediccionSigma: '', status: 'idle' }
  })),
  vaciarGaltonM10: () => set((state) => ({ galton10: { ...state.galton10, contenedores: new Array(11).fill(0), bolitasPendientes: 0, status: 'idle' } })),
  validarM10: () => {
    const galton = get().galton10;
    const isOk = MatDomain.validarM10(galton);
    if (isOk) {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      const { chi2, gl } = MatDomain.chiCuadradaM10(galton.contenedores, galton.probabilidad);
      registrarHallazgo('mat_galton_probabilidad', {
        probabilidad_p: galton.probabilidad,
        total_bolitas: galton.contenedores.reduce((a: number, b: number) => a + b, 0),
        distribucion: galton.contenedores,
        prediccion: { media: galton.prediccionMedia, sigma: galton.prediccionSigma },
        chi2, gl,
      });
      stopTimer();
      setPasoActual(3);
    }
    set((state) => ({ galton10: { ...state.galton10, status: isOk ? 'success' : 'error' } }));
    return isOk;
  },
  resetM10: () => set((state) => ({
    galton10: {
      poblacion: 100,
      probabilidad: state.galton10.probabilidad,
      simulando: false,
      contenedores: new Array(11).fill(0),
      bolitasPendientes: 0,
      status: 'idle',
      prediccionMedia: '',
      prediccionSigma: '',
    }
  })),

  // Cada vez que se abre un lab de matemáticas: intento nuevo (reset + semilla).
  entrarMatematicas: (n: number) => {
    const g = get();
    const resets = [g.resetM1, g.resetM2, g.resetM3, g.resetM4, g.resetM5, g.resetM6, g.resetM7, g.resetM8, g.resetM9, g.resetM10];
    resets[n - 1]?.();
    const semillas: Record<number, () => void> = {
      1: () => g.generarSemillaM1(), 2: () => g.generarSemillaM2(), 3: () => g.generarSemillaM3(),
      4: () => g.generarSemillaM4(), 5: () => g.generarSemillaM5(), 6: () => g.generarSemillaM6(),
      7: () => g.generarSemillaM7(), 8: () => g.generarSemillaM8(), 9: () => g.generarSemillaM9(),
      10: () => g.generarSemillaM10(),
    };
    semillas[n]?.();
  },
  // Único juez del botón «Validar práctica» para matemáticas: el veredicto lo da
  // el dominio y el mensaje orienta sin revelar la respuesta.
  validarLabMatematicas: (n: number) => {
    const g = get();
    const con = (ok: boolean, v: MatDomain.VeredictoM) => ({ ok, mensaje: ok ? undefined : v.mensaje });
    switch (n) {
      case 1: { const ok = g.validarM1(); return { ok, mensaje: ok ? undefined : get().cuadraticas.mensajeFeedback }; }
      case 2: return con(g.validarM2(), MatDomain.evaluarM2(get().sistemas2x2));
      case 3: return con(g.validarM3(), MatDomain.evaluarM3(get().richter));
      case 4: return con(g.validarM4(), MatDomain.evaluarM4(get().pitagoras));
      case 5: return con(g.validarM5(), MatDomain.evaluarM5(get().trigonometria));
      case 6: return con(g.validarM6(), MatDomain.evaluarM6(get().geometria6));
      case 7: return con(g.validarM7(), MatDomain.evaluarM7(get().optica7));
      case 8: return con(g.validarM8(), MatDomain.evaluarM8(get().derivada8));
      case 9: return con(g.validarM9(), MatDomain.evaluarM9(get().integral9));
      case 10: return con(g.validarM10(), MatDomain.evaluarM10(get().galton10));
    }
    return { ok: false, mensaje: `Lab matematicas-${n} no tiene validador.` };
  },
  resetMatematicas: () => {
    get().resetM1();
    get().resetM2();
    get().resetM3();
    get().resetM4();
    get().resetM5();
    get().resetM6();
    get().resetM7();
    get().resetM8();
    get().resetM9();
    get().resetM10();
  },
});
