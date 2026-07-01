import { StateCreator } from 'zustand';
import { SimuladorState, FisicaSlice } from '../types';
import * as FisicaDomain from '@/domain/fisica';

export const createFisicaSlice: StateCreator<SimuladorState, [], [], FisicaSlice> = (set, get) => ({
  plano2: { angulo: 30, coefRozamiento: 0.3, friccion: 0.1, masa: 5, animando: false, resultado: null },
  pendulo3: { longitud: 1.5, masa: 2.0, anguloInicial: 10, animando: false, periodo: 0, oscilando: false, resultado: null },
  hooke4: { k: 100, masa: 2.0, estiramiento: 0, amplitud: 0.5, oscilando: false, animando: false, t: 0, resultado: null },
  prensa5: { f1: 100, r1: 1.0, r2: 2.5, masaCarga: 500, ratio: 6.25, presion: 318310, isLifting: false, resultado: null },
  arquimedes6: { fluido: 'agua', densidadCuerpo: 800, densidadLiquido: 1000, volumenCuerpo: 0.001, sumergido: 0, radio: 0.5, isRunning: false, resultado: null },
  dilatacion7: { material: 'aluminio', tempIni: 20, tempFin: 20, longitud: 500, resultado: null },
  ohm8: { nivel: 1, voltaje: 12, resistencia: 220, switchOn: false, ledRoto: false, bateriaConectada: false, resistenciaConectada: false, ledConectado: false, resultado: null },
  electrostatica9: { q1: 1, q2: 1, distancia: 0.1, resultado: null },
  motor10: { imanIzq: 'N', imanDer: 'S', voltaje: 0, espiras: 10, interruptor: false, carga: 5, rpm: 0, encendido: false, resultado: null },
  tiro1: { angulo: 45, velocidad: 25, disparando: false,    targetX: 50,
    y0: 0,
    obsX: 0,
    obsY: 0,
    resultado: null,
    distanciaReal: 0,
    estado: 'idle',
    municion: 3,
    viento: 0,
    densidadAire: 1.225,
    yImpacto: 0,
    escenario: 'tierra'
  },

  setPlano2: (data: Partial<SimuladorState['plano2']>) => set((state) => ({ plano2: { ...state.plano2, ...data } })),
  setPendulo3: (data: Partial<SimuladorState['pendulo3']>) => set((state) => ({ pendulo3: { ...state.pendulo3, ...data } })),
  setHooke4: (data: Partial<SimuladorState['hooke4']>) => set((state) => ({ hooke4: { ...state.hooke4, ...data } })),
  setPrensa5: (data: Partial<SimuladorState['prensa5']>) => set((state) => ({ prensa5: { ...state.prensa5, ...data } })),
  setArquimedes6: (data: Partial<SimuladorState['arquimedes6']>) => set((state) => ({ arquimedes6: { ...state.arquimedes6, ...data } })),
  setDilatacion7: (data: Partial<SimuladorState['dilatacion7']>) => set((state) => ({ dilatacion7: { ...state.dilatacion7, ...data } })),
  setOhm8: (data: Partial<SimuladorState['ohm8']>) => set((state) => ({ ohm8: { ...state.ohm8, ...data } })),
  setElectrostatica9: (data: Partial<SimuladorState['electrostatica9']>) => set((state) => ({ electrostatica9: { ...state.electrostatica9, ...data } })),
  setMotor10: (data: Partial<SimuladorState['motor10']>) => set((state) => ({ motor10: { ...state.motor10, ...data } })),
  setTiro1: (data: Partial<SimuladorState['tiro1']>) => set((state) => ({ tiro1: { ...state.tiro1, ...data } })),
  
  generarSemillaF1: () => set((state) => {
    const esc = state.tiro1.escenario || 'tierra';
    
    // Presets de Escenario
    let g = 9.81;
    let rho = 1.225;
    let vientoMax = 5;

    if (esc === 'luna') { g = 1.62; rho = 0; vientoMax = 0; }
    else if (esc === 'marte') { g = 3.71; rho = 0.1; vientoMax = 15; }
    else if (esc === 'jupiter') { g = 24.79; rho = 5.0; vientoMax = 25; }

    // Escenario Táctico (Procedural)
    const targetX = Math.floor(Math.random() * (85 - 50 + 1)) + 50; 
    const y0 = Math.floor(Math.random() * (35 - 10 + 1)) + 10;
    const obsX = Math.floor(Math.random() * (targetX - 25 - 15 + 1)) + 15;
    const obsY = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
    const viento = (Math.random() * vientoMax * 2) - vientoMax;
    const densidadAire = rho;

    return { 
      tiro1: { 
        ...state.tiro1, targetX, y0, obsX, obsY, viento, densidadAire,
        resultado: null, disparando: false, estado: 'idle', distanciaReal: 0, municion: 3, yImpacto: 0 
      } 
    };
  }),

  ejecutarDisparoF1: () => {
    const state = get();
    if (state.tiro1.municion <= 0) return;

    const { angulo, velocidad, targetX, y0, obsX, obsY, viento, densidadAire, escenario } = state.tiro1;
    
    // Gravedad específica por planeta
    let G = 9.81;
    if (escenario === 'luna') G = 1.62;
    else if (escenario === 'marte') G = 3.71;
    else if (escenario === 'jupiter') G = 24.79;

    const rad = (angulo * Math.PI) / 180;
    
    // FISICA AVANZADA: Integración Numérica (Módelo de Arrastre)
    // Coeficiente de arrastre simplificado (C * rho * Area).
    // C=0.003 mantiene el arrastre visible pero permite alcanzar objetivos
    // a 50-85 m en todos los escenarios (con C=0.05 la Tierra topaba en ~46 m).
    const K = 0.003 * densidadAire;
    const dt = 0.02; // s
    
    let curX = 0;
    let curY = y0;
    let vx = velocidad * Math.cos(rad);
    let vy = velocidad * Math.sin(rad);
    let t = 0;
    let colisiona = false;
    let hitX = 0;
    let lastPositiveY = y0;

    // Simulación paso a paso
    while (curY >= 0 && t < 10) {
      // Fuerza de arrastre: F = -k * v * |v|
      const vTotal = Math.sqrt(vx * vx + vy * vy);
      const fx = -K * vx * vTotal + (viento * 0.5); // Viento afecta aceleración
      const fy = -G - K * vy * vTotal;

      // Actualizar velocidades (v = v + a*dt)
      vx += fx * dt;
      vy += fy * dt;

      // Actualizar posición (x = x + v*dt)
      curX += vx * dt;
      curY += vy * dt;
      t += dt;

      if (curY >= 0) lastPositiveY = curY;

      // Verificar colisión con muro (obstáculo dinámico)
      if (!colisiona && Math.abs(curX - obsX) < 1.0 && curY <= obsY) {
        colisiona = true;
        hitX = curX;
        break;
      }

      if (curY < 0) {
        hitX = curX;
        break;
      }
    }

    // Calcular resultado final
    let resultadoFinal: 'exito' | 'fallo' | 'colision' = 'fallo';
    if (colisiona) {
      resultadoFinal = 'colision';
    } else {
      const precision = Math.abs(hitX - targetX);
      if (precision < 2.5) resultadoFinal = 'exito';
    }

    set((s) => ({ 
      tiro1: { 
        ...s.tiro1, 
        disparando: true, 
        distanciaReal: hitX,
        yImpacto: colisiona ? curY : lastPositiveY, // Guardamos la última altura positiva antes del impacto
        resultado: null,
        municion: s.tiro1.municion - 1
      } 
    }));

    setTimeout(() => {
      const { registrarHallazgo, stopTimer, setPasoActual } = get();
      set((s) => {
        const res = resultadoFinal;
        const nuevoLog = {
          id: crypto.randomUUID(),
          angulo: s.tiro1.angulo,
          velocidad: s.tiro1.velocidad,
          escenario: s.tiro1.escenario,
          distancia: hitX.toFixed(2),
          resultado: res === 'exito' ? 'IMPACTO' : res === 'colision' ? 'MURO' : 'FALLO',
          timestamp: new Date().toLocaleTimeString()
        };

        if (res === 'exito') {
           registrarHallazgo('fis_tiro_impacto', {
             angulo: s.tiro1.angulo,
             velocidad: s.tiro1.velocidad,
             escenario: s.tiro1.escenario,
             target_x: s.tiro1.targetX,
             distancia_final: hitX,
             viento: s.tiro1.viento,
             precision: Math.abs(hitX - s.tiro1.targetX)
           });
           stopTimer();
           setPasoActual(4);
        }

        const logsPrevios = s.bitacoraData?.tiro_logs || [];
        
        return {
          tiro1: {
            ...s.tiro1,
            disparando: false,
            resultado: res,
            estado: res === 'exito' ? 'success' : s.tiro1.estado
          },
          bitacoraData: {
            ...s.bitacoraData,
            tiro_logs: [nuevoLog, ...logsPrevios].slice(0, 5)
          }
        };
      });
    }, Math.min(t * 500, 3000)); // Animación proporcional
  },

  validarF1: () => {
    const isOk = FisicaDomain.validarF1(get().tiro1);
    if (isOk) {
      set((state) => ({ tiro1: { ...state.tiro1, estado: 'success' } }));
      const { angulo, velocidad, escenario, targetX, distanciaReal, viento } = get().tiro1;
      get().registrarHallazgo('fis_tiro_parabolico', { angulo, velocidad, escenario, targetX, distanciaReal, viento });
    }
    return isOk;
  },
  validarF2: () => {
    const isOk = FisicaDomain.validarF2(get().plano2);
    set((state) => ({ plano2: { ...state.plano2, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) {
      const { angulo, coefRozamiento, masa } = get().plano2;
      get().registrarHallazgo('fis_plano_inclinado', { angulo, coefRozamiento, masa });
    }
    return isOk;
  },
  validarF3: () => {
    const isOk = FisicaDomain.validarF3(get().pendulo3);
    set((state) => ({ pendulo3: { ...state.pendulo3, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) {
      const { longitud, masa, anguloInicial, periodo } = get().pendulo3;
      get().registrarHallazgo('fis_pendulo', { longitud, masa, anguloInicial, periodo });
    }
    return isOk;
  },
  validarF4: () => {
    const isOk = FisicaDomain.validarF4(get().hooke4);
    set((state) => ({ hooke4: { ...state.hooke4, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) {
      const { k, masa, amplitud } = get().hooke4;
      get().registrarHallazgo('fis_hooke', { k, masa, amplitud });
    }
    return isOk;
  },
  validarF5: () => {
    const isOk = FisicaDomain.validarF5(get().bitacoraData);
    if (isOk) get().registrarHallazgo('fis_prensa_hidraulica', { resultado: 'exitoso' });
    return isOk;
  },
  validarF6: () => {
    const isOk = FisicaDomain.validarF6(get().arquimedes6);
    set((state) => ({ arquimedes6: { ...state.arquimedes6, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) {
      const { fluido, densidadCuerpo, densidadLiquido, volumenCuerpo } = get().arquimedes6;
      get().registrarHallazgo('fis_arquimedes', { fluido, densidadCuerpo, densidadLiquido, volumenCuerpo });
    }
    return isOk;
  },
  validarF7: () => {
    const isOk = FisicaDomain.validarF7(get().dilatacion7);
    set((state) => ({ dilatacion7: { ...state.dilatacion7, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) {
      const { material, tempIni, tempFin, longitud } = get().dilatacion7;
      get().registrarHallazgo('fis_dilatacion', { material, tempIni, tempFin, longitud });
    }
    return isOk;
  },
  validarF8: () => {
    const isOk = FisicaDomain.validarF8(get().ohm8);
    set((state) => ({ ohm8: { ...state.ohm8, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) {
      const { voltaje, resistencia, nivel } = get().ohm8;
      get().registrarHallazgo('fis_ohm', { voltaje, resistencia, nivel });
    }
    return isOk;
  },
  validarF9: () => {
    const isOk = FisicaDomain.validarF9(get().electrostatica9);
    set((state) => ({ electrostatica9: { ...state.electrostatica9, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) get().registrarHallazgo('fis_electrostatica', { resultado: 'exitoso' });
    return isOk;
  },
  validarF10: () => {
    const isOk = FisicaDomain.validarF10(get().motor10);
    set((state) => ({ motor10: { ...state.motor10, resultado: isOk ? 'exito' : 'error' } }));
    if (isOk) get().registrarHallazgo('fis_motor', { resultado: 'exitoso' });
    return isOk;
  },

  resetF1: () => get().generarSemillaF1(),

  resetF2: () => set({ plano2: { angulo: 30, coefRozamiento: 0.3, friccion: 0.1, masa: 5, animando: false, resultado: null } }),
  resetF3: () => set({ pendulo3: { longitud: 1.5, masa: 2.0, anguloInicial: 10, animando: false, periodo: 0, oscilando: false, resultado: null } }),
  resetF4: () => set({ hooke4: { k: 100, masa: 2.0, estiramiento: 0, amplitud: 0.5, oscilando: false, animando: false, t: 0, resultado: null } }),
  resetF5: () => set({ prensa5: { f1: 100, r1: 1.0, r2: 2.5, masaCarga: 500, ratio: 6.25, presion: 318310, isLifting: false, resultado: null } }),
  resetF6: () => set({ arquimedes6: { fluido: 'agua', densidadCuerpo: 800, densidadLiquido: 1000, volumenCuerpo: 0.001, sumergido: 0, radio: 0.5, isRunning: false, resultado: null } }),
  resetF7: () => set((state) => ({ dilatacion7: { material: 'aluminio', tempIni: 20, tempFin: 20, longitud: 500, resultado: null }, bitacoraData: { ...state.bitacoraData, fisica7: null } })),
  resetF8: () => set({ ohm8: { nivel: 1, voltaje: 12, resistencia: 220, switchOn: false, ledRoto: false, bateriaConectada: false, resistenciaConectada: false, ledConectado: false, resultado: null } }),
  resetF9: () => set({ electrostatica9: { q1: 1, q2: 1, distancia: 0.1, resultado: null } }),
  resetF10: () => set({ motor10: { imanIzq: 'N', imanDer: 'S', voltaje: 0, espiras: 10, interruptor: false, carga: 5, rpm: 0, encendido: false, resultado: null } }),
  resetFisica: () => {
    get().resetF1();
    get().resetF2();
    get().resetF3();
    get().resetF4();
    get().resetF5();
    get().resetF6();
    get().resetF7();
    get().resetF8();
    get().resetF9();
    get().resetF10();
  },
});
