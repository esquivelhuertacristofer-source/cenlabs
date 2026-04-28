import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';

export const createFisicaSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  plano2: { angulo: 30, coefRozamiento: 0.3, friccion: 0.1, masa: 5, animando: false, resultado: null },
  pendulo3: { longitud: 1.5, masa: 2.0, anguloInicial: 45, animando: false, periodo: 0, oscilando: false, resultado: null },
  hooke4: { k: 100, masa: 2.0, estiramiento: 0, amplitud: 0.5, oscilando: false, animando: false, t: 0, resultado: null },
  colisiones5: { m1: 2, v1: 5, m2: 2, v2: 0, tipo: 'elastica', animando: false, phase: 'idle', resultado: null },
  arquimedes6: { fluido: 'agua', densidadCuerpo: 800, volumenCuerpo: 0.001, sumergido: 0, resultado: null },
  dilatacion7: { material: 'hierro', tempIni: 20, tempFin: 100, longitud: 1.0, resultado: null },
  leyOhm8: { voltaje: 12, resistencia: 100, modo: 'serie', resultado: null },
  ohm8: { voltaje: 5, resistencia: 220, switchOn: false, ledRoto: false },
  electrostatica9: { q1: 1e-6, q2: 1e-6, distancia: 0.1, resultado: null },
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
  setColisiones5: (data: Partial<SimuladorState['colisiones5']>) => set((state) => ({ colisiones5: { ...state.colisiones5, ...data } })),
  setArquimedes6: (data: Partial<SimuladorState['arquimedes6']>) => set((state) => ({ arquimedes6: { ...state.arquimedes6, ...data } })),
  setDilatacion7: (data: Partial<SimuladorState['dilatacion7']>) => set((state) => ({ dilatacion7: { ...state.dilatacion7, ...data } })),
  setLeyOhm8: (data: Partial<SimuladorState['leyOhm8']>) => set((state) => ({ leyOhm8: { ...state.leyOhm8, ...data } })),
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
    // Coeficiente de arrastre simplificado (C * rho * Area)
    const K = 0.05 * densidadAire;
    const dt = 0.02; // s
    
    let curX = 0;
    let curY = y0;
    let vx = velocidad * Math.cos(rad);
    let vy = velocidad * Math.sin(rad);
    let t = 0;
    let colisiona = false;
    let hitX = 0;

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
        yImpacto: curY, // Guardamos la altura del impacto
        resultado: null,
        municion: s.tiro1.municion - 1
      } 
    }));

    setTimeout(() => {
      set((s) => ({
        tiro1: {
          ...s.tiro1,
          disparando: false,
          resultado: resultadoFinal,
        }
      }));
    }, Math.min(t * 500, 3000)); // Animación proporcional
  },

  validarF1: () => {
    const { tiro1 } = get();
    if (tiro1.resultado === 'exito') {
       set((state) => ({ tiro1: { ...state.tiro1, estado: 'success' } }));
       return true;
    }
    return false;
  },

  resetF1: () => get().generarSemillaF1(),
});
