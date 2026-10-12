import { StateCreator } from 'zustand';
import { SimuladorState, FisicaSlice } from '../types';
import * as F from '@/domain/fisica';

// Estados iniciales de cada lab de física. Las semillas (lo que cambia de un
// intento a otro) se siembran en `entrarFisica`; aquí solo hay valores neutros.
const tiro1Inicial = (): SimuladorState['tiro1'] => ({
  escenario: 'tierra', targetX: 60, y0: 20, obsX: 25, obsY: 15, viento: 0,
  angulo: 45, velocidad: 25, disparando: false, resultado: null,
  aciertos: 0, disparos: 0, municion: F.MUNICION_POR_MISION,
  distanciaReal: 0, yImpacto: 0, ultimoDisparo: null,
  densidadAire: F.ESCENARIOS.tierra.rho, estado: 'idle',
});
const plano2Inicial = (): SimuladorState['plano2'] => ({
  angulo: 20, empuje: 0, cargaExtra: 0, masaBase: 5, muK: 0.25, muS: 0.35, ensayo: null, resultado: null,
});
const pendulo3Inicial = (): SimuladorState['pendulo3'] => ({
  gSemilla: 9.81, longitud: 1.0, masa: 1.0, oscilando: false, muestras: [], gAlumno: null, resultado: null,
});
const hooke4Inicial = (): SimuladorState['hooke4'] => ({
  kSemilla: 40, masa: 1, amplitud: 0.2, oscilando: false, estatica: [], dinamica: [], kAlumno: null, resultado: null,
});
const prensa5Inicial = (): SimuladorState['prensa5'] => ({
  masaCarga: 500, r1: 1.0, r2: 2.5, f1: 0, prediccion: null, ensayo: null, resultado: null,
});
const arquimedes6Inicial = (): SimuladorState['arquimedes6'] => ({
  densidadCuerpo: 2700, volumenCuerpo: 2e-4, fluido: 'agua', densidadLiquido: F.FLUIDOS.agua.rho,
  sumergido: 0, lecturaAire: null, lecturaFluido: null, fluidoLectura: null, densidadAlumno: null, resultado: null,
});
const dilatacion7Inicial = (): SimuladorState['dilatacion7'] => ({
  material: 'aluminio', tempIni: F.T_AMBIENTE, longitud: F.L0_MM, alphaMisterioso: 19e-6,
  ensayo: null, alphaAlumno: null, resultado: null,
});
const ohm8Inicial = (): SimuladorState['ohm8'] => ({
  nivel: 1, voltaje: 9, resistencia: 100, switchOn: false, ledRoto: false,
  bateriaConectada: false, resistenciaConectada: false, ledConectado: false,
  rCalculada: null, ensayo: null, resultado: null,
});
const electrostatica9Inicial = (): SimuladorState['electrostatica9'] => ({
  q1: 1, q2: -1, distancia: 10, reto: { q1: 2, q2: -3, r: 12 }, respuesta: null, tipoRespuesta: null, resultado: null,
});
const motor10Inicial = (): SimuladorState['motor10'] => ({
  imanIzq: 'N', imanDer: 'N', voltaje: 0, espiras: 50, carga: 0.01, encendido: false,
  reto: { rpmObjetivo: 1200, sentido: 'horario', carga: 0.01 }, vPrediccion: null, ensayo: null, resultado: null,
});

export const createFisicaSlice: StateCreator<SimuladorState, [], [], FisicaSlice> = (set, get) => {
  // Guarda un veredicto en el objeto del lab y, si aprueba, deja constancia.
  const veredicto = <K extends keyof SimuladorState>(
    clave: K, v: F.Veredicto, hallazgo: string, datos: () => Record<string, unknown>,
  ) => {
    set((s) => ({ [clave]: { ...(s[clave] as object), resultado: v.ok ? 'exito' : 'error' } }) as Partial<SimuladorState>);
    if (v.ok) get().registrarHallazgo(hallazgo, datos());
    return v;
  };

  const evaluar = (n: number): F.Veredicto => {
    const s = get();
    switch (n) {
      case 1: return F.evaluarF1(s.tiro1);
      case 2: return veredicto('plano2', F.evaluarF2(s.plano2), 'fis_plano_inclinado', () => ({ ...s.plano2.ensayo }));
      case 3: return veredicto('pendulo3', F.evaluarF3(s.pendulo3), 'fis_pendulo', () => ({ g: s.pendulo3.gAlumno, muestras: s.pendulo3.muestras.length }));
      case 4: return veredicto('hooke4', F.evaluarF4(s.hooke4), 'fis_hooke', () => ({ k: s.hooke4.kAlumno, estatica: s.hooke4.estatica.length, dinamica: s.hooke4.dinamica.length }));
      case 5: return veredicto('prensa5', F.evaluarF5(s.prensa5), 'fis_prensa_hidraulica', () => ({ ...s.prensa5.ensayo }));
      case 6: return veredicto('arquimedes6', F.evaluarF6(s.arquimedes6), 'fis_arquimedes', () => ({ densidad: s.arquimedes6.densidadAlumno, fluido: s.arquimedes6.fluidoLectura }));
      case 7: return veredicto('dilatacion7', F.evaluarF7(s.dilatacion7), 'fis_dilatacion', () => ({ alpha: s.dilatacion7.alphaAlumno, ...s.dilatacion7.ensayo }));
      case 8: return veredicto('ohm8', F.evaluarF8(s.ohm8), 'fis_ohm', () => ({ ...s.ohm8.ensayo }));
      case 9: return veredicto('electrostatica9', F.evaluarF9(s.electrostatica9), 'fis_electrostatica', () => ({ ...s.electrostatica9.reto, F: s.electrostatica9.respuesta }));
      case 10: return veredicto('motor10', F.evaluarF10(s.motor10), 'fis_motor', () => ({ ...s.motor10.ensayo, ...s.motor10.reto }));
    }
    return { ok: false };
  };

  return {
    tiro1: tiro1Inicial(),
    plano2: plano2Inicial(),
    pendulo3: pendulo3Inicial(),
    hooke4: hooke4Inicial(),
    prensa5: prensa5Inicial(),
    arquimedes6: arquimedes6Inicial(),
    dilatacion7: dilatacion7Inicial(),
    ohm8: ohm8Inicial(),
    electrostatica9: electrostatica9Inicial(),
    motor10: motor10Inicial(),

    setPlano2: (data) => set((state) => ({ plano2: { ...state.plano2, ...data } })),
    setPendulo3: (data) => set((state) => ({ pendulo3: { ...state.pendulo3, ...data } })),
    setHooke4: (data) => set((state) => ({ hooke4: { ...state.hooke4, ...data } })),
    setPrensa5: (data) => set((state) => ({ prensa5: { ...state.prensa5, ...data } })),
    setArquimedes6: (data) => set((state) => ({ arquimedes6: { ...state.arquimedes6, ...data } })),
    setDilatacion7: (data) => set((state) => ({ dilatacion7: { ...state.dilatacion7, ...data } })),
    setOhm8: (data) => set((state) => ({ ohm8: { ...state.ohm8, ...data } })),
    setElectrostatica9: (data) => set((state) => ({ electrostatica9: { ...state.electrostatica9, ...data } })),
    setMotor10: (data) => set((state) => ({ motor10: { ...state.motor10, ...data } })),
    setTiro1: (data) => set((state) => ({ tiro1: { ...state.tiro1, ...data } })),

    // Nueva misión de tiro: diana, muro, altura y viento nuevos; munición llena.
    // Los aciertos del intento se conservan (un impacto confirmado no se borra).
    generarSemillaF1: () => set((state) => {
      const esc = state.tiro1.escenario || 'tierra';
      const mision = F.generarMision1(esc);
      return {
        tiro1: {
          ...state.tiro1, ...mision, densidadAire: F.ESCENARIOS[esc].rho,
          resultado: null, disparando: false, municion: F.MUNICION_POR_MISION,
          distanciaReal: 0, yImpacto: 0, ultimoDisparo: null,
        },
      };
    }),

    ejecutarDisparoF1: () => {
      const t1 = get().tiro1;
      if (t1.municion <= 0 || t1.disparando) return;
      const mision: F.Mision1 = { escenario: t1.escenario, targetX: t1.targetX, y0: t1.y0, obsX: t1.obsX, obsY: t1.obsY, viento: t1.viento };
      const disparo: F.Disparo1 = { angulo: t1.angulo, velocidad: t1.velocidad };
      const r = F.simularDisparo(mision, disparo);
      const id = Date.now() + Math.random();

      set((s) => ({
        tiro1: {
          ...s.tiro1, disparando: true, resultado: null, municion: s.tiro1.municion - 1,
          disparos: s.tiro1.disparos + 1,
          ultimoDisparo: { ...mision, ...disparo, id, tVuelo: r.t },
        },
      }));

      // El veredicto llega cuando la animación del proyectil termina.
      setTimeout(() => {
        const s = get();
        if (s.tiro1.ultimoDisparo?.id !== id) return; // el intento cambió mientras volaba
        const log = {
          id: String(id), angulo: disparo.angulo, velocidad: disparo.velocidad, escenario: mision.escenario,
          distancia: r.hitX.toFixed(2),
          resultado: r.resultado === 'exito' ? 'IMPACTO' : r.resultado === 'colision' ? 'MURO' : 'FALLO',
          timestamp: new Date().toLocaleTimeString(),
        };
        set((st) => ({
          tiro1: {
            ...st.tiro1, disparando: false, resultado: r.resultado, distanciaReal: r.hitX, yImpacto: r.yImpacto,
            aciertos: st.tiro1.aciertos + (r.resultado === 'exito' ? 1 : 0),
            estado: r.resultado === 'exito' ? 'success' : st.tiro1.estado,
          },
          bitacoraData: { ...st.bitacoraData, tiro_logs: [log, ...(st.bitacoraData?.tiro_logs || [])].slice(0, 8) },
        }));
        if (r.resultado === 'exito') {
          s.registrarHallazgo('fis_tiro_impacto', { ...mision, ...disparo, distancia_final: r.hitX });
          s.setPasoActual(4);
        }
      }, F.duracionAnimacionMs(r.t));
    },

    validarF1: () => evaluar(1).ok,
    validarF2: () => evaluar(2).ok,
    validarF3: () => evaluar(3).ok,
    validarF4: () => evaluar(4).ok,
    validarF5: () => evaluar(5).ok,
    validarF6: () => evaluar(6).ok,
    validarF7: () => evaluar(7).ok,
    validarF8: () => evaluar(8).ok,
    validarF9: () => evaluar(9).ok,
    validarF10: () => evaluar(10).ok,

    resetF1: () => { set({ tiro1: tiro1Inicial() }); get().generarSemillaF1(); },
    resetF2: () => set({ plano2: { ...plano2Inicial(), ...F.generarFriccion2() } }),
    resetF3: () => set({ pendulo3: { ...pendulo3Inicial(), gSemilla: F.generarGravedad3() } }),
    resetF4: () => set({ hooke4: { ...hooke4Inicial(), kSemilla: F.generarRigidez4() } }),
    resetF5: () => set({ prensa5: { ...prensa5Inicial(), masaCarga: F.generarCarga5() } }),
    resetF6: () => set({ arquimedes6: { ...arquimedes6Inicial(), ...F.generarSolido6() } }),
    resetF7: () => set({ dilatacion7: { ...dilatacion7Inicial(), alphaMisterioso: F.generarAlpha7() } }),
    resetF8: () => set({ ohm8: { ...ohm8Inicial(), voltaje: [4.5, 5, 6, 9, 12][Math.floor(Math.random() * 5)] } }),
    resetF9: () => set({ electrostatica9: { ...electrostatica9Inicial(), reto: F.generarReto9() } }),
    resetF10: () => {
      const reto = F.generarReto10();
      set({ motor10: { ...motor10Inicial(), reto, carga: reto.carga } });
    },

    // Cada vez que se abre un lab de física: intento nuevo con su semilla
    // (los reset de arriba ya siembran la incógnita de cada lab).
    entrarFisica: (n: number) => {
      const g = get();
      const resets = [g.resetF1, g.resetF2, g.resetF3, g.resetF4, g.resetF5, g.resetF6, g.resetF7, g.resetF8, g.resetF9, g.resetF10];
      resets[n - 1]?.();
    },

    // Único juez del botón «Validar práctica» para física.
    validarLabFisica: (n: number) => {
      const v = evaluar(n);
      return v.ok ? { ok: true } : { ok: false, mensaje: v.mensaje };
    },

    resetFisica: () => {
      const g = get();
      [g.resetF1, g.resetF2, g.resetF3, g.resetF4, g.resetF5, g.resetF6, g.resetF7, g.resetF8, g.resetF9, g.resetF10].forEach((r) => r());
    },
  };
};
