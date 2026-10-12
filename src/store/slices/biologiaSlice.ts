import { StateCreator } from 'zustand';
import {
  SimuladorState, BiologiaSlice, ResultadoValidacion,
  MicroscopioStateB1, TransporteStateB2, SintesisStateB3, FotosintesisStateB4, GeneticaStateB5,
  EvolucionStateB6, SistemaNerviosoStateB7, CardioStateB8, DigestionStateB9, EcosistemaStateB10,
  EnsayoReflejoB7,
} from '../types';
import * as B from '@/domain/biologia';

/*
 * Slice de Biología. La ciencia (modelos, tolerancias, validadores) vive en
 * src/domain/biologia.ts; aquí solo hay estado, semillas y acciones discretas.
 * Ningún lab escribe al store a la frecuencia de una animación: los Pilotos
 * animan en local y registran aquí eventos (un ensayo, una cruza, una corrida…).
 */

let contadorIds = 0;
const nuevoId = (pref: string) => `${pref}-${Date.now().toString(36)}-${(contadorIds++).toString(36)}`;
const azar = (min: number, max: number) => min + Math.random() * (max - min);
const azarEntero = (min: number, max: number) => Math.floor(azar(min, max + 1));
const redondear = (x: number, paso: number) => Math.round(x / paso) * paso;

const microscopioInicial = (): MicroscopioStateB1 => ({
  muestra: 'vegetal', objetivoMag: 4,
  enfoqueMacro: 0, enfoqueMicro: 0, enfoqueZ: 0, focoIdealZ: 50,
  iluminacion: 30, aceiteInmersionAplicado: false,
  posicionX: 0, posicionY: 0,
  muestraObjetivo: 'vegetal', targetOrganelle: 'Cloroplastos', magMin: 40,
  capturas: [], magnificacionVerified: false, abbeVerified: false,
  status: 'idle',
});

const transporteInicial = (): TransporteStateB2 => ({
  concExt: 0.25, glucosaExt: 0, concInt: 0.15, temperatura: 25,
  tipoCelula: 'animal', volumen: 100, lisada: false, status: 'idle',
});

const sintesisInicial = (): SintesisStateB3 => ({
  fase: 'transcripcion', adnPlantilla: 'TACCAGGGTTACATT', arnMensajero: '', proteina: [],
  errores: 0, currentIndex: 0, terminada: false, status: 'idle',
});

const fotosintesisInicial = (): FotosintesisStateB4 => ({
  distancia: 40, color: 'blanco', dMin: 20, meta: B.metaB4(20), ensayos: [], status: 'idle',
});

const geneticaInicial = (): GeneticaStateB5 => ({
  padre1: 'AaBb', padre2: 'AaBb', prediccion: [0, 0, 0, 0], tamanioMuestra: 100,
  poblacionF1: [], cruza: null, status: 'idle',
});

const evolucionInicial = (): EvolucionStateB6 => ({
  ambiente: 'industrial', generacion: 1, cuota: B.CUOTA_CAZA_B6, bugs: [], pInicialFav: 0.3, historial: [], status: 'idle',
});

const nerviosoInicial = (): SistemaNerviosoStateB7 => ({
  fuerzaGolpe: 50, integridadMielina: 100, umbral: 25, distancia: 1.0,
  ensayos: [], velocidadEstimada: null, diagnostico: null, status: 'idle',
});

const cardioInicial = (): CardioStateB8 => ({
  tipo: 'bradicardia', fcInicial: 45, ritmoBPM: 45,
  dosis: { atropina: 0, metoprolol: 0, adrenalina: 0 },
  diagnostico: null, lecturaFC: null, status: 'idle',
});

const digestionInicial = (): DigestionStateB9 => ({
  macronutriente: 'proteina', enzimaSeleccionada: null, nivelPH: 7, bilis: false,
  ensayo: null, organoRespuesta: null, absorcionRespuesta: null, status: 'idle',
});

const ecosistemaInicial = (): EcosistemaStateB10 => ({
  poblacionPresas: 100, poblacionDepredadores: 20, presasIniciales: 100, depredadoresIniciales: 20,
  parametros: { alpha: 1.1, beta: 0.1, gamma: 0.4, delta: 0.05 },
  tiempoVirtual: 0, historial: [], simulando: false, corrida: null, status: 'idle',
});

export const createBiologiaSlice: StateCreator<SimuladorState, [], [], BiologiaSlice> = (set, get) => {
  /** Ejecuta un evaluador de dominio, deja el veredicto en `status` y registra el hallazgo. */
  const juzgar = <K extends 'microscopio' | 'transporte' | 'sintesis' | 'fotosintesis' | 'genetica' | 'evolucion' | 'sistemaNervioso' | 'cardio' | 'digestion' | 'ecosistema'>(
    clave: K, evaluar: (s: SimuladorState[K]) => ResultadoValidacion, hallazgo: string, datos: (s: SimuladorState[K]) => Record<string, unknown>,
  ): ResultadoValidacion => {
    const r = evaluar(get()[clave]);
    set((state) => ({ [clave]: { ...state[clave], status: r.ok ? 'success' : 'error' } }) as unknown as Partial<SimuladorState>);
    if (r.ok) get().registrarHallazgo(hallazgo, datos(get()[clave]));
    return r;
  };

  const evaluadores: Record<number, () => ResultadoValidacion> = {
    1: () => juzgar('microscopio', B.evaluarB1, 'bio_microscopio', (m) => ({ muestra: m.muestra, objetivo: m.objetivoMag, organelo: m.targetOrganelle, iluminacion: m.iluminacion })),
    2: () => juzgar('transporte', B.evaluarB2, 'bio_transporte', (t) => ({ nacl: t.concExt, glucosa: t.glucosaExt, tipoCelula: t.tipoCelula, temperatura: t.temperatura })),
    3: () => juzgar('sintesis', B.evaluarB3, 'bio_sintesis_proteica', (s) => ({ adnPlantilla: s.adnPlantilla, arn: s.arnMensajero, proteina: s.proteina.map((a) => a.name).join('-'), errores: s.errores })),
    4: () => juzgar('fotosintesis', B.evaluarB4, 'bio_fotosintesis', (f) => ({ ensayos: f.ensayos.length, meta: f.meta, dMin: f.dMin })),
    5: () => juzgar('genetica', B.evaluarB5, 'bio_genetica', (g) => ({ cruza: `${g.padre1} × ${g.padre2}`, n: g.cruza?.n, observados: g.cruza?.observados })),
    6: () => juzgar('evolucion', B.evaluarB6, 'bio_evolucion', (e) => ({ ambiente: e.ambiente, generaciones: e.historial.length, pInicial: e.pInicialFav, pFinal: e.historial[e.historial.length - 1]?.pFav })),
    7: () => juzgar('sistemaNervioso', B.evaluarB7, 'bio_sistema_nervioso', (s) => ({ velocidadEstimada: s.velocidadEstimada, diagnostico: s.diagnostico, ensayos: s.ensayos.length })),
    8: () => juzgar('cardio', B.evaluarB8, 'bio_cardiovascular', (c) => ({ diagnostico: c.diagnostico, fcFinal: c.ritmoBPM, dosis: c.dosis })),
    9: () => juzgar('digestion', B.evaluarB9, 'bio_digestion', (d) => ({ sustrato: d.macronutriente, enzima: d.ensayo?.enzima, pH: d.ensayo?.pH, bilis: d.ensayo?.bilis, organo: d.organoRespuesta })),
    10: () => juzgar('ecosistema', B.evaluarB10, 'bio_ecosistema', (e) => ({ parametros: e.parametros, anios: e.corrida?.t })),
  };

  return {
    // ── B1 Microscopio ────────────────────────────────────────────────────────
    microscopio: microscopioInicial(),
    setMicroscopio: (data) => set((state) => {
      const m = { ...state.microscopio, ...data };
      // El plano de enfoque siempre se deriva de los dos tornillos.
      m.enfoqueZ = m.enfoqueMacro + m.enfoqueMicro / 10;
      return { microscopio: m };
    }),
    generarSemillaB1: () => set(() => {
      const obj = B.OBJETIVOS_B1[Math.floor(Math.random() * B.OBJETIVOS_B1.length)];
      return {
        microscopio: {
          ...microscopioInicial(),
          capturas: [],
          muestra: obj.muestra === 'vegetal' ? 'animal' : 'vegetal', // la platina NO arranca con la preparación pedida
          muestraObjetivo: obj.muestra, targetOrganelle: obj.organelo, magMin: obj.magMin,
          focoIdealZ: redondear(azar(30, 70), 0.01),
        },
      };
    }),
    validarB1: () => evaluadores[1]().ok,
    resetB1: () => set((state) => ({
      microscopio: {
        ...state.microscopio,
        objetivoMag: 4, enfoqueMacro: 0, enfoqueMicro: 0, enfoqueZ: 0, iluminacion: 30,
        aceiteInmersionAplicado: false, posicionX: 0, posicionY: 0, status: 'idle',
        magnificacionVerified: false, abbeVerified: false,
      },
    })),
    tomarCaptura: (url: string) => set((state) => ({
      microscopio: { ...state.microscopio, capturas: [url, ...state.microscopio.capturas].slice(0, 6) },
    })),

    // ── B2 Ósmosis ────────────────────────────────────────────────────────────
    transporte: transporteInicial(),
    setTransporte: (data) => set((state) => ({ transporte: { ...state.transporte, ...data } })),
    generarSemillaB2: () => set((state) => ({
      transporte: {
        ...transporteInicial(),
        tipoCelula: state.transporte.tipoCelula,
        // Citoplasma entre 0.24 y 0.36 Osm/L (290 mOsm es el valor fisiológico humano).
        concInt: redondear(azar(0.24, 0.36), 0.005) / B.I_NACL,
      },
    })),
    validarB2: () => evaluadores[2]().ok,
    resetB2: () => set((state) => ({
      transporte: { ...state.transporte, concExt: 0.25, glucosaExt: 0, temperatura: 25, volumen: 100, lisada: false, status: 'idle' },
    })),

    // ── B3 Síntesis de proteínas ──────────────────────────────────────────────
    sintesis: sintesisInicial(),
    addNucleotido: (base: string) => set((state) => {
      const s = state.sintesis;
      if (s.fase !== 'transcripcion') return {};
      const esperada = B.COMPLEMENTO_ARN[s.adnPlantilla[s.arnMensajero.length]];
      if (base !== esperada) return { sintesis: { ...s, errores: s.errores + 1 } };
      const arn = s.arnMensajero + base;
      const fin = arn.length === s.adnPlantilla.length;
      return { sintesis: { ...s, arnMensajero: arn, currentIndex: fin ? 0 : arn.length, fase: fin ? 'traduccion' : 'transcripcion' } };
    }),
    advanceRibosoma: (eleccion: string) => set((state) => {
      const s = state.sintesis;
      if (s.fase !== 'traduccion' || s.terminada) return {};
      const codon = s.arnMensajero.slice(s.currentIndex, s.currentIndex + 3);
      const aa = B.CODIGO_GENETICO[codon] ?? { name: '???', color: '#64748b' };
      const esParo = aa.name === 'STOP' || codon.length < 3;
      // El alumno elige el ARNt cuyo anticodón aparea con el codón (o el factor de liberación en un paro).
      const correcta = esParo ? B.LIBERACION_B3 : B.anticodonB3(codon);
      if (eleccion !== correcta) return { sintesis: { ...s, errores: s.errores + 1 } };
      if (esParo) return { sintesis: { ...s, terminada: true } };
      return { sintesis: { ...s, proteina: [...s.proteina, { id: nuevoId('aa'), ...aa }], currentIndex: s.currentIndex + 3 } };
    }),
    generarSemillaB3: () => set(() => ({ sintesis: { ...sintesisInicial(), adnPlantilla: B.semillaB3() } })),
    validarB3: () => evaluadores[3]().ok,
    resetB3: () => get().generarSemillaB3(),

    // ── B4 Fotosíntesis ───────────────────────────────────────────────────────
    fotosintesis: fotosintesisInicial(),
    setFotosintesis: (data) => set((state) => ({ fotosintesis: { ...state.fotosintesis, ...data } })),
    registrarEnsayoB4: () => set((state) => {
      const f = state.fotosintesis;
      const distancia = Math.max(f.dMin, f.distancia);
      const ensayo = { color: f.color, distancia, o2: B.o2EnsayoB4(f.color, distancia) };
      return { fotosintesis: { ...f, ensayos: [...f.ensayos, ensayo].slice(-12) } };
    }),
    generarSemillaB4: () => set(() => {
      const dMin = azarEntero(16, 28);
      return { fotosintesis: { ...fotosintesisInicial(), dMin, meta: B.metaB4(dMin), distancia: 45 } };
    }),
    validarB4: () => evaluadores[4]().ok,
    resetB4: () => set((state) => ({ fotosintesis: { ...state.fotosintesis, ensayos: [], status: 'idle' } })),

    // ── B5 Herencia mendeliana ────────────────────────────────────────────────
    genetica: geneticaInicial(),
    setGenetica: (data) => set((state) => ({ genetica: { ...state.genetica, ...data } })),
    generarF1: () => set((state) => {
      const g = state.genetica;
      const { genotipos, observados } = B.cruzarB5(g.padre1, g.padre2, g.tamanioMuestra);
      return {
        genetica: {
          ...g, poblacionF1: genotipos,
          cruza: { padre1: g.padre1, padre2: g.padre2, n: g.tamanioMuestra, prediccion: [...g.prediccion] as GeneticaStateB5['prediccion'], observados },
        },
      };
    }),
    generarSemillaB5: () => set(() => {
      const [p1, p2] = B.CRUZAS_B5[Math.floor(Math.random() * B.CRUZAS_B5.length)];
      return { genetica: { ...geneticaInicial(), padre1: p1, padre2: p2 } };
    }),
    validarB5: () => evaluadores[5]().ok,
    resetB5: () => set((state) => ({ genetica: { ...state.genetica, poblacionF1: [], cruza: null, prediccion: [0, 0, 0, 0], status: 'idle' } })),

    // ── B6 Selección natural ──────────────────────────────────────────────────
    evolucion: evolucionInicial(),
    setEvolucion: (data) => set((state) => ({ evolucion: { ...state.evolucion, ...data } })),
    cazarPolilla: (id: number) => set((state) => {
      const e = state.evolucion;
      const cazadas = e.bugs.filter((b) => b.cazada).length;
      const bug = e.bugs.find((b) => b.id === id);
      if (!bug || bug.cazada || cazadas >= e.cuota || e.historial.length >= B.GENERACIONES_MAX_B6) return {};
      return { evolucion: { ...e, bugs: e.bugs.map((b) => (b.id === id ? { ...b, cazada: true } : b)) } };
    }),
    finalizarGeneracion: () => set((state) => {
      const e = state.evolucion;
      if (e.bugs.filter((b) => b.cazada).length < e.cuota || e.historial.length >= B.GENERACIONES_MAX_B6) return {};
      const hijos = B.reproducirB6(e.bugs, B.N_POLILLAS_B6, Math.random, (e.generacion) * 100);
      const nueva = { ...e, bugs: hijos, generacion: e.generacion + 1 };
      const pFav = B.pFavActualB6(nueva);
      const fOscuras = hijos.filter((b) => b.tipo === 'oscura').length / hijos.length;
      const selectividad = B.selectividadB6(e.bugs, e.ambiente);
      return { evolucion: { ...nueva, historial: [...e.historial, { gen: nueva.generacion, pFav, fOscuras, selectividad }] } };
    }),
    generarSemillaB6: () => set(() => {
      const ambiente: EvolucionStateB6['ambiente'] = Math.random() > 0.5 ? 'industrial' : 'limpio';
      // Industrial (s. XIX): carbonaria aún escasa. Limpio (tras las leyes de aire limpio): typica en
      // recuperación; si fuera muy rara (q < 0.4), con 30 polillas la deriva taparía a la selección.
      const pFav = redondear(ambiente === 'industrial' ? azar(0.2, 0.35) : azar(0.4, 0.55), 1 / (2 * B.N_POLILLAS_B6));
      const pC = B.aleloFavorecidoB6(ambiente) === 'C' ? pFav : 1 - pFav;
      const bugs = B.crearPoblacionB6(pC, B.N_POLILLAS_B6);
      const base: EvolucionStateB6 = { ...evolucionInicial(), ambiente, bugs, pInicialFav: 0 };
      return { evolucion: { ...base, pInicialFav: B.pFavActualB6(base) } };
    }),
    validarB6: () => evaluadores[6]().ok,
    resetB6: () => get().generarSemillaB6(),

    // ── B7 Arco reflejo ───────────────────────────────────────────────────────
    sistemaNervioso: nerviosoInicial(),
    setB7State: (data) => set((state) => ({ sistemaNervioso: { ...state.sistemaNervioso, ...data } })),
    registrarGolpeB7: () => {
      const s = get().sistemaNervioso;
      const respuesta = s.fuerzaGolpe >= s.umbral;
      const ensayo: EnsayoReflejoB7 = { fuerza: s.fuerzaGolpe, respuesta, latencia: respuesta ? B.latenciaB7(s.distancia, s.integridadMielina) : null };
      set((state) => ({ sistemaNervioso: { ...state.sistemaNervioso, ensayos: [...state.sistemaNervioso.ensayos, ensayo].slice(-10) } }));
      return ensayo;
    },
    generarSemillaB7: () => set(() => {
      // Paciente sano (v ≥ 54 m/s) o con desmielinización clara (v ≤ 35 m/s): sin casos limítrofes.
      const sano = Math.random() < 0.5;
      return {
        sistemaNervioso: {
          ...nerviosoInicial(),
          integridadMielina: Math.round(sano ? azar(90, 100) : azar(35, 70)),
          umbral: azarEntero(15, 35),
          distancia: redondear(azar(0.85, 1.1), 0.01),
          fuerzaGolpe: 50,
        },
      };
    }),
    validarB7: () => evaluadores[7]().ok,
    resetB7: () => set((state) => ({ sistemaNervioso: { ...state.sistemaNervioso, ensayos: [], velocidadEstimada: null, diagnostico: null, status: 'idle' } })),

    // ── B8 ECG ────────────────────────────────────────────────────────────────
    cardio: cardioInicial(),
    setCardio: (data) => set((state) => ({ cardio: { ...state.cardio, ...data } })),
    administrarFarmacoB8: (farmaco) => set((state) => {
      const c = state.cardio;
      if ((c.dosis[farmaco] ?? 0) >= B.FARMACOS_B8[farmaco].max) return {};
      const dosis = { ...c.dosis, [farmaco]: c.dosis[farmaco] + 1 };
      return { cardio: { ...c, dosis, ritmoBPM: B.fcConDosisB8(c.fcInicial, dosis), lecturaFC: null } };
    }),
    generarSemillaB8: () => set(() => {
      const tipo: CardioStateB8['tipo'] = Math.random() < 0.5 ? 'bradicardia' : 'taquicardia';
      const fc = tipo === 'bradicardia' ? azarEntero(38, 52) : azarEntero(112, 140);
      return { cardio: { ...cardioInicial(), tipo, fcInicial: fc, ritmoBPM: fc } };
    }),
    validarB8: () => evaluadores[8]().ok,
    resetB8: () => set((state) => ({
      cardio: { ...state.cardio, ritmoBPM: state.cardio.fcInicial, dosis: { atropina: 0, metoprolol: 0, adrenalina: 0 }, diagnostico: null, lecturaFC: null, status: 'idle' },
    })),

    // ── B9 Digestión ──────────────────────────────────────────────────────────
    digestion: digestionInicial(),
    setDigestion: (data) => set((state) => ({ digestion: { ...state.digestion, ...data } })),
    incubarB9: () => set((state) => {
      const d = state.digestion;
      if (!d.enzimaSeleccionada) return {};
      return { digestion: { ...d, ensayo: B.incubarB9(d.macronutriente, d.enzimaSeleccionada, d.nivelPH, d.bilis) } };
    }),
    generarSemillaB9: () => set(() => {
      const macros: DigestionStateB9['macronutriente'][] = ['almidon', 'proteina', 'lipido'];
      return { digestion: { ...digestionInicial(), macronutriente: macros[Math.floor(Math.random() * macros.length)] } };
    }),
    validarB9: () => evaluadores[9]().ok,
    resetB9: () => set((state) => ({ digestion: { ...digestionInicial(), macronutriente: state.digestion.macronutriente } })),

    // ── B10 Poblaciones ───────────────────────────────────────────────────────
    ecosistema: ecosistemaInicial(),
    setEcosistema: (data) => set((state) => ({ ecosistema: { ...state.ecosistema, ...data } })),
    registrarCorridaB10: (corrida, presas, depredadores, historial) => set((state) => ({
      ecosistema: {
        ...state.ecosistema, corrida, tiempoVirtual: corrida.t, poblacionPresas: presas, poblacionDepredadores: depredadores,
        historial: historial.slice(-300), simulando: false, status: corrida.extincion ? 'extinction' : 'idle',
      },
    })),
    generarSemillaB10: () => set(() => {
      const x0 = azarEntero(80, 120), y0 = azarEntero(15, 25);
      return {
        ecosistema: {
          ...ecosistemaInicial(),
          poblacionPresas: x0, poblacionDepredadores: y0, presasIniciales: x0, depredadoresIniciales: y0,
          parametros: {
            alpha: redondear(azar(1.0, 1.2), 0.01), beta: redondear(azar(0.08, 0.12), 0.001),
            gamma: redondear(azar(0.3, 0.5), 0.01), delta: redondear(azar(0.04, 0.06), 0.001),
          },
        },
      };
    }),
    validarB10: () => evaluadores[10]().ok,
    resetB10: () => set((state) => ({
      ecosistema: {
        ...state.ecosistema, poblacionPresas: state.ecosistema.presasIniciales, poblacionDepredadores: state.ecosistema.depredadoresIniciales,
        tiempoVirtual: 0, historial: [], simulando: false, corrida: null, status: 'idle',
      },
    })),

    // Cada vez que se abre un lab de biología: intento nuevo (reset + semilla).
    entrarBiologia: (n: number) => {
      const g = get();
      const resets = [g.resetB1, g.resetB2, g.resetB3, g.resetB4, g.resetB5, g.resetB6, g.resetB7, g.resetB8, g.resetB9, g.resetB10];
      resets[n - 1]?.();
      const semillas = [g.generarSemillaB1, g.generarSemillaB2, g.generarSemillaB3, g.generarSemillaB4, g.generarSemillaB5,
        g.generarSemillaB6, g.generarSemillaB7, g.generarSemillaB8, g.generarSemillaB9, g.generarSemillaB10];
      semillas[n - 1]?.();
    },
    // Único juez del botón «Validar práctica» para biología (mismos evaluadores que usa cada panel).
    validarLabBiologia: (n: number) => evaluadores[n]?.() ?? { ok: false, mensaje: `biologia-${n} no tiene validador.` },
    resetBiologia: () => {
      const g = get();
      [g.resetB1, g.resetB2, g.resetB3, g.resetB4, g.resetB5, g.resetB6, g.resetB7, g.resetB8, g.resetB9, g.resetB10].forEach((r) => r());
    },
  };
};
