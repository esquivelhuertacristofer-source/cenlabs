import { SimuladorState } from '@/store/types';

type MicroscopioState   = SimuladorState['microscopio'];
type TransporteState    = SimuladorState['transporte'];
type SintesisState      = SimuladorState['sintesis'];
type FotosintesisState  = SimuladorState['fotosintesis'];
type GeneticaState      = SimuladorState['genetica'];
type EvolucionState     = SimuladorState['evolucion'];
type SistemaNerviosoState = SimuladorState['sistemaNervioso'];
type CardioState        = SimuladorState['cardio'];
type DigestionState     = SimuladorState['digestion'];
type EcosistemaState    = SimuladorState['ecosistema'];

// B1 — Microscopía (objetivo, iluminación, enfoque)
export function validarB1(microscopio: MicroscopioState, magMin: number = 40): boolean {
  const isMagOk   = microscopio.objetivoMag >= magMin;
  const isLightOk = microscopio.iluminacion >= 60 && microscopio.iluminacion <= 95;
  const focusDiff = Math.abs(microscopio.enfoqueZ - microscopio.focoIdealZ);
  const tolerance = microscopio.objetivoMag === 100 ? 1 : microscopio.objetivoMag === 40 ? 3 : 8;
  return isMagOk && isLightOk && focusDiff <= tolerance;
}

// B2 — Transporte Celular (equilibrio osmótico)
export function validarB2(transporte: TransporteState): boolean {
  return Math.abs(transporte.concExt - transporte.concInt) < 0.05;
}

// B3 — Síntesis de Proteínas: traducción correcta (errores === 0 y proteína armada)
// No depende de status para evitar exploit por localStorage.
export function validarB3(sintesis: SintesisState): boolean {
  return sintesis.proteina.length > 0 && sintesis.errores === 0;
}

// B4 — Fotosíntesis: O2 acumulado alcanza el objetivo real de la semilla
// No depende de status para evitar exploit por localStorage.
export function validarB4(fotosintesis: FotosintesisState): boolean {
  return fotosintesis.oxigenoAcumulado >= fotosintesis.targetO2;
}

// B5 — Genética Mendeliana: generación F1 producida (al menos una cruza ejecutada)
// No depende de status para evitar exploit por localStorage.
export function validarB5(genetica: GeneticaState): boolean {
  return genetica.poblacionF1.length > 0;
}

// B6 — Evolución (Polilla del Abedul)
export function validarB6(evolucion: EvolucionState): boolean {
  return evolucion.generacion >= 3;
}

// B7 — Sistema Nervioso (reflejo)
export function validarB7(sistemaNervioso: SistemaNerviosoState): boolean {
  return sistemaNervioso.status === 'success';
}

// B8 — Sistema Cardiovascular (BPM target ±5)
export function validarB8(cardio: CardioState): boolean {
  return Math.abs(cardio.ritmoBPM - cardio.targetBPM) < 5;
}

// B9 — Sistema Digestivo (absorción de monómeros)
export function validarB9(digestion: DigestionState): boolean {
  return digestion.monomerosAbsorbidos > 0;
}

// B10 — Ecosistemas (Lotka-Volterra)
export function validarB10(ecosistema: EcosistemaState): boolean {
  return ecosistema.tiempoVirtual > 10;
}
