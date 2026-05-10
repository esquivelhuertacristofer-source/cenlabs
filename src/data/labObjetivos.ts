export type Objetivo = { label: string; current: number; target: number; completed: boolean };

export interface ObjetivosState {
  pActual: number; nActual: number; eActual: number;
  targetZ: number; targetA: number; targetCharge: number;
  gases: any; balanceo: any; limitante: any; soluciones: any; solubilidad: any;
  titulacion: any; equilibrio: any; celda: any; destilacion: any;
  tiroParabolico: any; planoInclinado: any; pendulo: any; hooke: any;
}

export function getLabObjetivos(normalizedId: string, s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;

  switch (normalizedId) {
    case 'quimica-1': return [
      { label: 'Número Atómico (Z)',  current: pActual,            target: targetZ,            completed: pActual === targetZ },
      { label: 'Masa Atómica (A)',    current: pActual + nActual,  target: targetA,            completed: (pActual + nActual) === targetA },
      { label: 'Carga Neta',          current: pActual - eActual,  target: targetCharge,       completed: (pActual - eActual) === targetCharge },
    ];
    case 'quimica-2': return [
      { label: 'Volumen Constante (L)',  current: gases?.V || 0,  target: 10,                  completed: Math.abs((gases?.V || 0) - 10) < 0.1 },
      { label: 'Presión Objetivo (atm)', current: gases?.P || 0,  target: gases?.pTarget || 2, completed: Math.abs((gases?.P || 0) - (gases?.pTarget || 2)) < 0.1 },
      { label: 'Integridad de Cámara',   current: gases?.P || 0,  target: 7.0,                 completed: (gases?.P || 0) < 7.0 },
    ];
    case 'quimica-3': return [
      { label: 'Equilibrio Atómico', current: balanceo?.isBalanced ? 1 : 0,        target: 1,                          completed: balanceo?.isBalanced || false },
      { label: 'Ley de Lavoisier',   current: balanceo?.masaReactivos || 0,        target: balanceo?.masaProductos || 0, completed: Math.abs((balanceo?.masaReactivos || 0) - (balanceo?.masaProductos || 0)) < 0.01 },
      { label: 'Nivel de Reactor',   current: (balanceo?.reaccionActual || 0) + 1, target: balanceo?.reacciones?.length || 6, completed: false },
    ];
    case 'quimica-4': return [
      { label: 'Reactivo Limitante', current: limitante?.status === 'success' ? 1 : 0,    target: 1,                               completed: limitante?.status === 'success' },
      { label: 'Cálculo de Exceso',  current: limitante?.status === 'success' ? 1 : 0,    target: 1,                               completed: limitante?.status === 'success' },
      { label: 'Fase de Síntesis',   current: (limitante?.reaccionActual || 0) + 1,       target: limitante?.reacciones?.length || 4, completed: false },
    ];
    case 'quimica-5': return [
      { label: 'Pesaje Analítico',    current: soluciones?.matraz?.polvo || 0,  target: soluciones?.mRequerida || 7.305, completed: Math.abs((soluciones?.matraz?.polvo || 0) - (soluciones?.mRequerida || 7.305)) < 0.05 },
      { label: 'Exactitud de Aforo',  current: soluciones?.matraz?.agua || 0,   target: soluciones?.vTarget || 250,      completed: Math.abs((soluciones?.matraz?.agua || 0) - (soluciones?.vTarget || 250)) < 1.0 },
      { label: 'Certificación de M',  current: soluciones?.status === 'success' ? 1 : 0, target: 1,                    completed: soluciones?.status === 'success' },
    ];
    case 'quimica-6': return [
      { label: 'Homogeneidad Térmica', current: solubilidad?.temp || 0,                    target: 50, completed: (solubilidad?.temp || 0) > 40 },
      { label: 'Punto de Saturación',  current: solubilidad?.status === 'success' ? 1 : 0, target: 1,  completed: solubilidad?.status === 'success' },
      { label: 'Análisis de Fase',     current: solubilidad?.status === 'success' ? 1 : 0, target: 1,  completed: solubilidad?.status === 'success' },
    ];
    case 'quimica-7': return [
      { label: 'Calibración de Bureta',   current: titulacion?.purgada ? 1 : 0,            target: 1, completed: titulacion?.purgada },
      { label: 'Sensibilidad Visual',      current: titulacion?.indicador ? 1 : 0,          target: 1, completed: titulacion?.indicador },
      { label: 'Certificación de Ma',      current: titulacion?.status === 'success' ? 1 : 0, target: 1, completed: titulacion?.status === 'success' },
    ];
    case 'quimica-8': return [
      { label: 'Perturbación Térmica',        current: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'caliente') ? 1 : 0, target: 1, completed: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'caliente') },
      { label: 'Análisis Criogénico',         current: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'hielo') ? 1 : 0,    target: 1, completed: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'hielo') },
      { label: "Deducción de Le Châtelier",   current: equilibrio?.status === 'success' ? 1 : 0,                                    target: 1, completed: equilibrio?.status === 'success' },
    ];
    case 'quimica-9': return [
      { label: 'Cierre del Circuito',         current: celda?.puenteSalino ? 1 : 0,      target: 1, completed: celda?.puenteSalino },
      { label: 'Diferencia de Potencial',     current: celda?.cablesConectados ? 1 : 0,  target: 1, completed: celda?.cablesConectados },
      { label: 'Eficiencia Energética (V+)',  current: celda?.voltaje > 0 ? 1 : 0,       target: 1, completed: celda?.voltaje > 0 },
    ];
    case 'quimica-10': return [
      { label: 'Estabilidad Térmica',        current: destilacion?.tempMezcla > 75 ? 1 : 0,                            target: 1,  completed: destilacion?.tempMezcla > 75 },
      { label: 'Recuperación de Solvente',   current: Math.min(50, Math.round(destilacion?.volDestilado || 0)),         target: 50, completed: destilacion?.volDestilado >= 50 },
      { label: 'Certificación de Pureza',    current: destilacion?.volDestilado > 50 ? 1 : 0,                          target: 1,  completed: destilacion?.volDestilado > 50 },
    ];
    case 'fisica-1': return [
      { label: 'Estabilidad de Lanzamiento', current: tiroParabolico?.disparando || !!tiroParabolico?.resultado ? 1 : 0, target: 1, completed: tiroParabolico?.disparando || !!tiroParabolico?.resultado },
      { label: 'Precisión Balística',        current: tiroParabolico?.resultado === 'exito' ? 1 : 0,                     target: 1, completed: tiroParabolico?.resultado === 'exito' },
      { label: 'Optimización de Alcance',    current: tiroParabolico?.angulo === 45 ? 1 : 0,                             target: 1, completed: tiroParabolico?.angulo === 45 },
    ];
    case 'fisica-2': return [
      { label: 'Configuración del Plano',    current: planoInclinado?.angulo > 0 ? 1 : 0,                  target: 1, completed: planoInclinado?.angulo > 0 },
      { label: 'Análisis de Rozamiento',    current: (planoInclinado?.coefRozamiento || 0) > 0 ? 1 : 0,  target: 1, completed: (planoInclinado?.coefRozamiento || 0) > 0 },
      { label: 'Certificación Dinámica',    current: planoInclinado?.resultado === 'exito' ? 1 : 0,       target: 1, completed: planoInclinado?.resultado === 'exito' },
    ];
    case 'fisica-3': return [
      { label: 'Configuración de Longitud', current: pendulo?.longitud > 0 ? 1 : 0,          target: 1, completed: pendulo?.longitud > 0 },
      { label: 'Sincronización de MAS',     current: pendulo?.oscilando ? 1 : 0,             target: 1, completed: pendulo?.oscilando },
      { label: 'Certificación Gravimétrica',current: pendulo?.resultado === 'exito' ? 1 : 0, target: 1, completed: pendulo?.resultado === 'exito' },
    ];
    case 'fisica-4': return [
      { label: 'Prueba de Carga Estática',  current: hooke?.masa > 0 ? 1 : 0,                       target: 1, completed: hooke?.masa > 0 },
      { label: 'Análisis de Compresión',    current: (hooke?.estiramiento || 0) !== 0 ? 1 : 0,      target: 1, completed: (hooke?.estiramiento || 0) !== 0 },
      { label: 'Certificación de Rigidez',  current: hooke?.resultado === 'exito' ? 1 : 0,          target: 1, completed: hooke?.resultado === 'exito' },
    ];
    default: return [];
  }
}
