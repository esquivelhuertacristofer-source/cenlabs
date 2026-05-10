import { SimuladorState, BitacoraData } from '@/store/types';

type CuadraticasState = SimuladorState['cuadraticas'];
type Sistemas2x2State = SimuladorState['sistemas2x2'];
type RichterState     = SimuladorState['richter'];
type PitaGorasState   = SimuladorState['pitagoras'];
type TrigonometriaState = SimuladorState['trigonometria'];
type Geometria6State  = SimuladorState['geometria6'];
type Optica7State     = SimuladorState['optica7'];
type Derivada8State   = SimuladorState['derivada8'];
type Integral9State   = SimuladorState['integral9'];
type Galton10State    = SimuladorState['galton10'];

// M1 — Ecuaciones Cuadráticas (parábola)
export function validarM1(cuadraticas: CuadraticasState): boolean {
  const { a, b, c, target } = cuadraticas;
  return (
    Math.abs(a - target.a) < 0.15 &&
    Math.abs(b - target.b) < 0.3 &&
    Math.abs(c - target.c) < 0.3
  );
}

export function feedbackM1(cuadraticas: CuadraticasState): string {
  const { a, b, target } = cuadraticas;
  if (Math.sign(a) !== Math.sign(target.a))
    return "ERROR: Concavidad invertida. Verifica el signo de 'a'.";
  if (Math.abs(a - target.a) > 0.5)
    return "CONSEJO: Ajusta la apertura (|a|) para que coincida con la curva guía.";
  if (Math.abs(-b / (2 * a) - (-target.b / (2 * target.a))) > 0.5)
    return "LOGÍSTICA: El vértice horizontal no está sincronizado. Revisa 'b'.";
  return "AJUSTE FINO: Estás muy cerca de la trayectoria proyectada.";
}

// M2 — Sistemas 2×2 (intersección de rectas)
export interface ValidarM2Result {
  isOk: boolean;
  interseccion?: { x: number; y: number };
}

export function validarM2(sistemas: Sistemas2x2State): ValidarM2Result {
  const { m1, b1, m2, b2, target } = sistemas;
  if (Math.abs(m1 - m2) < 0.001) return { isOk: false };
  const xi = (b2 - b1) / (m1 - m2);
  const yi = m1 * xi + b1;
  const isOk = Math.abs(xi - target.x) < 0.1 && Math.abs(yi - target.y) < 0.1;
  return { isOk, interseccion: { x: xi, y: yi } };
}

// M3 — Escala Richter (logaritmos)
export function validarM3(richter: RichterState): boolean {
  const realFactor = Math.pow(10, 1.5 * (richter.targetM - richter.magnitudBase));
  const userVal    = parseFloat(richter.userInputFactor);
  if (!isFinite(userVal) || realFactor === 0) return false;
  return Math.abs(userVal - realFactor) / realFactor < 0.05;
}

// M4 — Teorema de Pitágoras
export function validarM4(pitagoras: PitaGorasState): boolean {
  const realC  = Math.sqrt(pitagoras.catetoA ** 2 + pitagoras.catetoB ** 2);
  const userVal = parseFloat(pitagoras.userInputC);
  return Math.abs(userVal - realC) < 0.1;
}

// M5 — Trigonometría (puntos críticos sin/cos)
export function validarM5(trig: TrigonometriaState): boolean {
  const hallazgos = trig.hallazgos ?? [];
  const tieneCriticos = hallazgos.length >= 2;
  return tieneCriticos && (Math.abs(trig.angulo - 45) <= 1 || Math.abs(trig.angulo - 225) <= 1);
}

// M6 — Transformaciones Geométricas (exactas)
export function validarM6(geo: Geometria6State): boolean {
  return (
    geo.tx === geo.target.tx &&
    geo.ty === geo.target.ty &&
    geo.rotacion === geo.target.rotacion &&
    geo.escala === geo.target.escala
  );
}

// M7 — Óptica / Ley de Snell (índice de refracción)
export function validarM7(optica: Optica7State): boolean {
  const userVal = parseFloat(optica.userInputN2);
  return Math.abs(userVal - optica.n2Misterio) <= 0.05;
}

// M8 — Derivadas (punto crítico de f(x) = x³/3 - 2x² + 3x)
export function validarM8(derivada: Derivada8State): boolean {
  return Math.abs(derivada.xActual ** 2 - 4 * derivada.xActual + 3) <= 0.05;
}

// M9 — Integral de Riemann
export function validarM9(errorPorcentual: number): boolean {
  return errorPorcentual < 0.5;
}

// M10 — Distribución de Galton (probabilidad normal)
export function validarM10(galton: Galton10State): boolean {
  const total = galton.contenedores.reduce((a, b) => a + b, 0);
  return total >= 200;
}
