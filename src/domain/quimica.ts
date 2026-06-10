import { SimuladorState } from '@/store/types';

type ParticulasState  = SimuladorState['particulas'];
type GasesState       = SimuladorState['gases'];
type BalanceoState    = SimuladorState['balanceo'];
type LimitanteState   = SimuladorState['limitante'];
type SolucionesState  = SimuladorState['soluciones'];
type SolubilidadState = SimuladorState['solubilidad'];
type TitulacionState  = SimuladorState['titulacion'];
type EquilibrioState  = SimuladorState['equilibrio'];
type CeldaState       = SimuladorState['celda'];
type DestilacionState = SimuladorState['destilacion'];

const ELEMENT_NAMES: Record<number, string> = {
  1: 'Hidrógeno', 2: 'Helio', 3: 'Litio', 4: 'Berilio', 5: 'Boro',
  6: 'Carbono', 7: 'Nitrógeno', 8: 'Oxígeno', 9: 'Flúor', 10: 'Neón',
};

export interface ValidarQ1Result {
  isOk: boolean;
  message: string;
  estrellas?: number;
}

// Q1 — Construcción Atómica
export function validarQ1(p: ParticulasState): ValidarQ1Result {
  const expectedElectrons  = p.targetZ - p.targetCharge;
  const isCorrectElement   = p.protones === p.targetZ;
  const isCorrectIsotope   = (p.protones + p.neutrones) === p.targetA;
  const isCorrectCharge    = p.electrones === expectedElectrons;
  const targetName         = ELEMENT_NAMES[p.targetZ] ?? 'Elemento';

  if (isCorrectElement && isCorrectIsotope && isCorrectCharge) {
    const chargeLabel = p.targetCharge === 0
      ? ''
      : `${p.targetCharge > 0 ? '+' : ''}${p.targetCharge}`;
    const estrellas = p.intentos === 0 ? 3 : p.intentos === 1 ? 2 : 1;
    return {
      isOk: true,
      estrellas,
      message: `¡${targetName}${chargeLabel} logrado! ${estrellas === 3 ? '¡Perfecto al primer intento!' : ''}`,
    };
  }

  let message = 'Configuración subatómica incorrecta.';
  if (!isCorrectElement)
    message = `Elemento incorrecto: tienes Z=${p.protones} (${ELEMENT_NAMES[p.protones] ?? 'desconocido'}), necesitas Z=${p.targetZ} (${targetName}).`;
  else if (!isCorrectIsotope)
    message = `Masa atómica incorrecta: A=${p.protones + p.neutrones}, necesitas A=${p.targetA}. Verifica neutrones (N=${p.targetA - p.targetZ}).`;
  else
    message = p.targetCharge === 0
      ? `Carga neta ≠ 0: tienes ${p.electrones} e⁻, necesitas ${expectedElectrons} para átomo neutro.`
      : `Carga incorrecta: necesitas ${p.targetCharge > 0 ? 'ceder' : 'ganar'} ${Math.abs(p.targetCharge)} e⁻ (${expectedElectrons} e⁻ en total).`;

  return { isOk: false, message };
}

// Q2 — Gases Ideales
export function validarQ2(gases: GasesState): boolean {
  return !gases.isExploded && Math.abs(gases.P - gases.pTarget) < 0.1;
}

// Q3 — Balanceo de Ecuaciones
export function validarQ3(balanceo: BalanceoState): boolean {
  return (balanceo.reaccionesCompletadas?.length ?? 0) >= 4;
}

// Q4 — Reactivo Limitante
export function validarQ4(
  limitante: LimitanteState,
  ansLimitanteIdx: number,
  ansExceso: number,
): boolean {
  const { limitingIdx, excessMass } = limitante.results ?? { limitingIdx: -1, excessMass: 0 };
  return ansLimitanteIdx === limitingIdx && Math.abs(ansExceso - (excessMass ?? 0)) < 0.1;
}

// Q5 — Preparación de Soluciones
export function validarQ5(soluciones: SolucionesState): boolean {
  const pm      = soluciones.sal?.pm ?? 58.443;
  const purity  = soluciones.sal?.purity ?? 1.0;
  const safeV   = Math.max(1, soluciones.matraz.agua);
  const mActual = (soluciones.matraz.polvo * purity / pm) / (safeV / 1000);
  return Math.abs(mActual - soluciones.mTarget) < 0.05;
}

// Q6 — Solubilidad y Cristalización
export function validarQ6(solubilidad: SolubilidadState): boolean {
  const s = solubilidad.sustancias[solubilidad.sustanciaIdx];
  if (!s) return false;
  if (solubilidad.ubicacion !== 'hielo') return false;
  if (solubilidad.salAgregada <= 0) return false;
  const limiteSolubilidad = (s.a as number) * Math.exp((s.b as number) * solubilidad.temp);
  return solubilidad.salAgregada > limiteSolubilidad;
}

// Q7 — Titulación Ácido-Base
export function validarQ7(titulacion: TitulacionState, ansCa: number): boolean {
  return Math.abs(ansCa - titulacion.ca) < 0.01;
}

// Q8 — Equilibrio Químico (Le Châtelier)
export function validarQ8(
  equilibrio: EquilibrioState,
  d1: string, d2: string, d3: string,
): boolean {
  const tHielo = equilibrio.jeringas.find(j => j.id === 3)?.temp ?? 20;
  return tHielo < 10 && d1 === 'transparente' && d2 === 'cafe' && d3 === 'incoloro';
}

// Q9 — Celda Galvánica
export function validarQ9(
  celda: CeldaState,
  anodo: string, catodo: string, v: number,
): boolean {
  const pots: Record<string, number> = { Zn: -0.76, Cu: 0.34, Ag: 0.80, Mg: -2.37 };
  const metals = celda.seedMetales ?? [];
  if (metals.length < 2) return false;
  const [m1, m2] = metals;
  // Metal with lower reduction potential is the anode (oxidised)
  const correctAnodo = (pots[m1] ?? 0) < (pots[m2] ?? 0) ? m1 : m2;
  const correctCatodo = correctAnodo === m1 ? m2 : m1;
  const expectedVoltage = Math.abs((pots[correctCatodo] ?? 0) - (pots[correctAnodo] ?? 0));
  return anodo === correctAnodo && catodo === correctCatodo && Math.abs(v - expectedVoltage) < 0.05;
}

// Q10 — Destilación Fraccionada
export function validarQ10(destilacion: DestilacionState, pureza: number): boolean {
  return destilacion.volDestilado > 50 && Math.abs(pureza - 95) < 5;
}
