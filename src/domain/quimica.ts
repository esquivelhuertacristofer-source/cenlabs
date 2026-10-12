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

/** Veredicto de un validador de dominio: el mensaje orienta sin dar la respuesta. */
export interface Veredicto {
  ok: boolean;
  mensaje?: string;
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Q2 — Gases Ideales
// ─────────────────────────────────────────────────────────────────────────────
export const R_GAS = 0.08206; // L·atm/(mol·K)
export const TOLERANCIA_Q2_ATM = 0.1;

/** PV = nRT  →  P = nRT / V  (atm, con V en L y T en K). */
export function presionIdeal(n: number, T: number, V: number): number {
  return (n * R_GAS * T) / Math.max(1e-6, V);
}

export function validarQ2(gases: GasesState): boolean {
  return !gases.isExploded && Math.abs(gases.P - gases.pTarget) < TOLERANCIA_Q2_ATM;
}

// ─────────────────────────────────────────────────────────────────────────────
// Q3 — Balanceo de Ecuaciones
// ─────────────────────────────────────────────────────────────────────────────
export interface MoleculaBalanceo { formula: string; atomos: Record<string, number>; molar: number }
export interface ReaccionBalanceo { id: string; reactivos: MoleculaBalanceo[]; productos: MoleculaBalanceo[] }

/** Átomos totales de cada lado con los coeficientes dados (reactivos primero, luego productos). */
export function contarAtomos(reac: ReaccionBalanceo, coefs: number[]) {
  const reactivos: Record<string, number> = {};
  const productos: Record<string, number> = {};
  reac.reactivos.forEach((m, i) => {
    for (const [s, c] of Object.entries(m.atomos)) reactivos[s] = (reactivos[s] ?? 0) + c * (coefs[i] ?? 1);
  });
  reac.productos.forEach((m, i) => {
    const k = coefs[reac.reactivos.length + i] ?? 1;
    for (const [s, c] of Object.entries(m.atomos)) productos[s] = (productos[s] ?? 0) + c * k;
  });
  return { reactivos, productos };
}

export function estaBalanceada(reac: ReaccionBalanceo, coefs: number[]): boolean {
  const { reactivos, productos } = contarAtomos(reac, coefs);
  const simbolos = new Set([...Object.keys(reactivos), ...Object.keys(productos)]);
  return Array.from(simbolos).every((s) => reactivos[s] === productos[s]);
}

function mcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : mcd(b, a % b);
}

/** Balanceada CON los coeficientes enteros mínimos (su MCD es 1): 2,10,6,8 no cuenta. */
export function esBalanceoMinimo(reac: ReaccionBalanceo, coefs: number[]): boolean {
  if (!estaBalanceada(reac, coefs)) return false;
  return coefs.reduce((g, c) => mcd(g, c), 0) === 1;
}

export const REACCIONES_REQUERIDAS_Q3 = 4;

export function validarQ3(balanceo: BalanceoState): boolean {
  return (balanceo.reaccionesCompletadas?.length ?? 0) >= REACCIONES_REQUERIDAS_Q3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Q4 — Reactivo Limitante
// ─────────────────────────────────────────────────────────────────────────────
export interface ReactivoEsteq { formula: string; molar: number; coef: number }
export interface ReaccionLimitante { reactivos: ReactivoEsteq[]; productos: ReactivoEsteq[] }

export interface AnalisisLimitante {
  moles: number[];
  limitingIdx: number;
  /** Masa del reactivo en exceso que queda sin reaccionar (g). */
  excessMass: number;
  /** Masa máxima del primer producto (g). */
  theoreticalYield: number;
  /** true si las dos razones moles/coeficiente están a menos de 1 %: no hay un limitante claro. */
  ambiguo: boolean;
}

/** Estequiometría: el limitante es el de menor moles/coeficiente. */
export function analizarLimitante(reac: ReaccionLimitante, masas: number[]): AnalisisLimitante {
  const moles = masas.map((m, i) => m / reac.reactivos[i].molar);
  const razones = moles.map((n, i) => n / reac.reactivos[i].coef);
  const limitingIdx = razones[0] <= razones[1] ? 0 : 1;
  const exc = 1 - limitingIdx;
  const avance = razones[limitingIdx]; // mol de "reacción"
  const excessMass = Math.max(0, (moles[exc] - avance * reac.reactivos[exc].coef) * reac.reactivos[exc].molar);
  const theoreticalYield = avance * reac.productos[0].coef * reac.productos[0].molar;
  const mayor = Math.max(razones[0], razones[1]);
  const ambiguo = mayor > 0 && Math.abs(razones[0] - razones[1]) / mayor < 0.01;
  return { moles, limitingIdx, excessMass, theoreticalYield, ambiguo };
}

/**
 * Masas iniciales (g, a 0.1 g) con un limitante claro: el otro reactivo va entre
 * 1.2 y 2.5 veces lo estequiométrico, sobra al menos 0.3 g y ninguna pasa de 150 g.
 * Cualquiera de los dos puede ser el limitante.
 */
export function generarMasasLimitante(reac: ReaccionLimitante, rnd: () => number = Math.random): number[] {
  const r1 = (x: number) => Math.round(x * 10) / 10;
  for (let intento = 0; intento < 200; intento++) {
    const lim = rnd() < 0.5 ? 0 : 1;
    const exc = 1 - lim;
    const mLim = 3 + rnd() * 37;
    const avance = mLim / (reac.reactivos[lim].coef * reac.reactivos[lim].molar);
    const mExc = (1.2 + rnd() * 1.3) * avance * reac.reactivos[exc].coef * reac.reactivos[exc].molar;
    const masas = [0, 0];
    masas[lim] = r1(mLim);
    masas[exc] = r1(mExc);
    if (masas.some((m) => m < 0.5 || m > 150)) continue;
    const a = analizarLimitante(reac, masas);
    if (!a.ambiguo && a.limitingIdx === lim && a.excessMass >= 0.3) return masas;
  }
  // Respaldo determinista: 1 mol de avance con 50 % de exceso del segundo reactivo.
  return [
    r1(reac.reactivos[0].coef * reac.reactivos[0].molar * 0.2),
    r1(reac.reactivos[1].coef * reac.reactivos[1].molar * 0.3),
  ];
}

/** Tolerancia del exceso: 2 % o 0.05 g, lo que sea mayor (masas molares con 3 decimales). */
export function toleranciaExceso(exceso: number): number {
  return Math.max(0.05, 0.02 * exceso);
}

export function validarQ4(limitante: LimitanteState): Veredicto {
  const reac = limitante.reacciones?.[limitante.reaccionActual];
  const masas = limitante.inputMasses ?? [];
  if (!reac || masas.length < 2 || masas.some((m) => !(m > 0))) {
    return { ok: false, mensaje: 'Carga los dos reactivos antes de analizar la síntesis.' };
  }
  const r = limitante.respuesta;
  if (!r || r.limitanteIdx === null || r.limitanteIdx === undefined || r.exceso === null || r.exceso === undefined || !Number.isFinite(r.exceso)) {
    return { ok: false, mensaje: 'Registra en la consola cuál reactivo es el limitante y cuántos gramos sobran del reactivo en exceso.' };
  }
  const a = analizarLimitante(reac, masas);
  if (!a.ambiguo && r.limitanteIdx !== a.limitingIdx) {
    return { ok: false, mensaje: 'Ese reactivo no es el que se agota primero. Compara moles ÷ coeficiente de cada reactivo.' };
  }
  if (Math.abs(r.exceso - a.excessMass) > toleranciaExceso(a.excessMass)) {
    return { ok: false, mensaje: 'El limitante es correcto, pero la masa sobrante no cuadra: calcula cuánto del otro reactivo se consume y réstalo de su masa inicial.' };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Q5 — Preparación de Soluciones
// ─────────────────────────────────────────────────────────────────────────────
/** Tolerancia de la molaridad: ±5 % relativo (la que anuncia la interfaz). */
export const TOLERANCIA_Q5_REL = 0.05;

/** Aforo: la base del menisco sobre la marca; ±0.2 % del volumen nominal, mínimo ±0.5 mL. */
export function toleranciaAforo(vTarget: number): number {
  return Math.max(0.5, 0.002 * vTarget);
}

export function aforoCorrecto(agua: number, vTarget: number): boolean {
  return Math.abs(agua - vTarget) <= toleranciaAforo(vTarget);
}

export function sobrepasaAforo(agua: number, vTarget: number): boolean {
  return agua > vTarget + toleranciaAforo(vTarget);
}

/** M = (masa · pureza / PM) / V(L). */
export function molaridadSolucion(s: SolucionesState): number {
  const pm     = s.sal?.pm ?? 58.443;
  const purity = s.sal?.purity ?? 1.0;
  if (!(s.matraz.agua > 0)) return 0;
  return (s.matraz.polvo * purity / pm) / (s.matraz.agua / 1000);
}

export function validarQ5(s: SolucionesState): Veredicto {
  if (!(s.matraz.polvo > 0)) return { ok: false, mensaje: 'Pesa el soluto y transfiérelo al matraz aforado.' };
  if (!aforoCorrecto(s.matraz.agua, s.vTarget)) {
    return { ok: false, mensaje: sobrepasaAforo(s.matraz.agua, s.vTarget)
      ? 'Te pasaste de la marca de aforo: la solución quedó diluida y hay que prepararla de nuevo.'
      : 'Completa el aforo: la base del menisco debe tocar la marca del matraz.' };
  }
  const m = molaridadSolucion(s);
  if (Math.abs(m - s.mTarget) / s.mTarget > TOLERANCIA_Q5_REL) {
    return { ok: false, mensaje: 'La molaridad no está dentro de ±5 % del objetivo. Revisa la masa que pesaste.' };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Q6 — Solubilidad y Cristalización
// ─────────────────────────────────────────────────────────────────────────────
// Solubilidad en g de sal anhidra por 100 g de agua, de 0 a 100 °C.
// Fuente: CRC Handbook of Chemistry and Physics, «Aqueous Solubility of
// Inorganic Compounds at Various Temperatures» (mismos valores en Perry's
// Chemical Engineers' Handbook, tabla 2-120). Entre puntos: interpolación lineal.
export type TablaSolubilidad = [number, number][];
export const TABLAS_SOLUBILIDAD: Record<string, TablaSolubilidad> = {
  kno3:  [[0, 13.3], [10, 20.9], [20, 31.6], [30, 45.8], [40, 63.9], [50, 85.5], [60, 110], [70, 138], [80, 169], [90, 202], [100, 246]],
  nacl:  [[0, 35.7], [10, 35.8], [20, 35.9], [30, 36.1], [40, 36.4], [50, 36.7], [60, 37.1], [70, 37.5], [80, 38.0], [90, 38.5], [100, 39.2]],
  cuso4: [[0, 14.3], [10, 17.4], [20, 20.7], [30, 25.0], [40, 28.5], [50, 33.3], [60, 40.0], [80, 55.0], [100, 75.4]],
  kclo3: [[0, 3.3], [10, 5.2], [20, 7.3], [30, 10.1], [40, 13.9], [50, 19.3], [60, 23.8], [80, 37.5], [100, 56.3]],
};

export const T_AMBIENTE_Q6 = 20;

/** S(T) en g/100 g H₂O por interpolación lineal de la tabla. */
export function solubilidadA(tabla: TablaSolubilidad, T: number): number {
  if (T <= tabla[0][0]) return tabla[0][1];
  for (let i = 1; i < tabla.length; i++) {
    const [t1, s1] = tabla[i];
    if (T <= t1) {
      const [t0, s0] = tabla[i - 1];
      return s0 + (s1 - s0) * (T - t0) / (t1 - t0);
    }
  }
  return tabla[tabla.length - 1][1];
}

/**
 * ¿Toda la sal quedó disuelta en caliente siendo más de la que admite el agua a
 * temperatura ambiente? Esa es la disolución que, al enfriarse, cristaliza.
 */
export function disueltaEnCaliente(tabla: TablaSolubilidad, salAgregada: number, T: number): boolean {
  return salAgregada > solubilidadA(tabla, T_AMBIENTE_Q6) && salAgregada <= solubilidadA(tabla, T);
}

export function validarQ6(sol: SolubilidadState): Veredicto {
  const s = sol.sustancias?.[sol.sustanciaIdx];
  if (!s?.tabla) return { ok: false, mensaje: 'Elige una sustancia.' };
  if (!sol.disueltoEnCaliente) {
    return { ok: false, mensaje: 'Primero disuelve en caliente más sal de la que admite el agua a 20 °C: toda la sal debe quedar disuelta.' };
  }
  if (sol.ubicacion !== 'hielo' || sol.temp > 10) {
    return { ok: false, mensaje: 'Enfría la disolución en el baño de hielo para provocar la cristalización.' };
  }
  if (!(sol.salAgregada > solubilidadA(s.tabla, sol.temp))) {
    return { ok: false, mensaje: 'A esta temperatura toda la sal sigue disuelta: no hay cristales. Necesitas una disolución más concentrada.' };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Q7 — Titulación Ácido-Base (HCl con NaOH, ácido fuerte / base fuerte)
// ─────────────────────────────────────────────────────────────────────────────
export const VIRAJE_FENOLFTALEINA = 8.2;
export const TOLERANCIA_Q7_REL = 0.02;
export const CAPACIDAD_BURETA_ML = 50;

/** pH tras añadir vb mL de base (cb) a va mL de ácido (ca). Incluye la dilución. */
export function phTitulacion(ca: number, va: number, cb: number, vb: number): number {
  const nA = ca * va / 1000;
  const nB = cb * vb / 1000;
  const vT = (va + vb) / 1000;
  if (Math.abs(nA - nB) < 1e-12) return 7;
  if (nA > nB) return -Math.log10((nA - nB) / vT);
  return 14 + Math.log10((nB - nA) / vT);
}

export function validarQ7(t: TitulacionState): Veredicto {
  if (!t.purgada) return { ok: false, mensaje: 'Carga y purga la bureta antes de titular: una burbuja de aire falsea la lectura.' };
  if (!t.indicador) return { ok: false, mensaje: 'Añade fenolftaleína al matraz: sin indicador no puedes ver el punto final.' };
  if (phTitulacion(t.ca, t.va, t.cb, t.volumenBase) < VIRAJE_FENOLFTALEINA) {
    return { ok: false, mensaje: 'Aún no llegas al punto final: sigue añadiendo NaOH hasta un rosa tenue persistente.' };
  }
  const r = t.respuestaCa;
  if (r === null || r === undefined || !Number.isFinite(r)) {
    return { ok: false, mensaje: 'Calcula [HCl] con el volumen de NaOH del punto final y regístrala.' };
  }
  if (Math.abs(r - t.ca) / t.ca > TOLERANCIA_Q7_REL) {
    return { ok: false, mensaje: 'La concentración no coincide (±2 %). Usa Ca·Va = Cb·Vb con el volumen del primer rosa persistente.' };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Q8 — Equilibrio N₂O₄ ⇌ 2NO₂ (Le Châtelier)
// ─────────────────────────────────────────────────────────────────────────────
// Kp(298 K) = 0.148 atm y ΔH° = +57.2 kJ/mol (endotérmica hacia NO₂).
// Fuente: Atkins, Physical Chemistry, y NIST-JANAF (ΔfH° N₂O₄ y NO₂).
const KP_298 = 0.148;
const DH_J = 57200;
const R_J = 8.314;

/** Fracción molar de NO₂ en la jeringa a 1 atm y temperatura T (°C), vía van 't Hoff. */
export function fraccionNO2(tempC: number): number {
  const T = tempC + 273.15;
  const kp = KP_298 * Math.exp(-(DH_J / R_J) * (1 / T - 1 / 298.15));
  const alfa = Math.sqrt(kp / (kp + 4)); // grado de disociación a P = 1 atm
  return (2 * alfa) / (1 + alfa);
}

export type ColorNO2 = 'palido' | 'ambar' | 'cafe';
export const COLORES_NO2: { id: ColorNO2; etiqueta: string }[] = [
  { id: 'palido', etiqueta: 'Casi incoloro (amarillo muy pálido)' },
  { id: 'ambar',  etiqueta: 'Ámbar / café claro' },
  { id: 'cafe',   etiqueta: 'Café rojizo intenso' },
];

/** Color de la mezcla: el NO₂ es el único que absorbe en el visible. */
export function colorMezclaNO2(tempC: number): ColorNO2 {
  const x = fraccionNO2(tempC);
  if (x < 0.2) return 'palido';   // por debajo de ~12 °C
  if (x < 0.55) return 'ambar';   // ~12–46 °C (a 20 °C, x ≈ 0.27)
  return 'cafe';
}

/**
 * Tono aproximado de la jeringa (hex) para dibujarla: degradado de tres paradas
 * en función de la fracción de NO₂ — casi incoloro (x = 0), ámbar (x ≈ 0.3) y
 * café rojizo (x = 1). Solo para la vista; el juicio usa colorMezclaNO2.
 */
export function tonoMezclaNO2(tempC: number): string {
  const x = Math.min(1, Math.max(0, fraccionNO2(tempC)));
  const paradas: [number, [number, number, number]][] = [
    [0, [251, 247, 228]], [0.3, [217, 144, 47]], [1, [107, 36, 8]],
  ];
  const k = x <= 0.3 ? 0 : 1;
  const [x0, c0] = paradas[k];
  const [x1, c1] = paradas[k + 1];
  const t = (x - x0) / (x1 - x0);
  const c = c0.map((v, i) => Math.round(v + (c1[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const TEMP_BANO_Q8: Record<'mesa' | 'caliente' | 'hielo', number> = { mesa: 20, caliente: 80, hielo: 0 };

export function validarQ8(eq: EquilibrioState): Veredicto {
  const js = eq.jeringas ?? [];
  const lugares = new Set(js.map((j) => j.ubicacion));
  if (js.length < 3 || !(lugares.has('hielo') && lugares.has('mesa') && lugares.has('caliente'))) {
    return { ok: false, mensaje: 'Coloca una jeringa en cada baño (hielo, ambiente y caliente) para comparar.' };
  }
  if (js.some((j) => Math.abs(j.temp - TEMP_BANO_Q8[j.ubicacion]) > 1.5)) {
    return { ok: false, mensaje: 'Espera a que cada jeringa alcance la temperatura de su baño: el equilibrio necesita tiempo.' };
  }
  const obs = eq.observaciones ?? {};
  if (js.some((j) => !obs[j.id])) return { ok: false, mensaje: 'Registra el color que observas en cada jeringa.' };
  if (js.some((j) => obs[j.id] !== colorMezclaNO2(j.temp))) {
    return { ok: false, mensaje: 'Al menos una observación no coincide con el color de su jeringa. Vuelve a observarlas.' };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Q9 — Celda Galvánica
// ─────────────────────────────────────────────────────────────────────────────
/** E° de reducción a 25 °C (V). Fuente: CRC Handbook, «Electrochemical Series». */
export const E0_REDUCCION: Record<string, number> = { Zn: -0.76, Cu: 0.34, Ag: 0.80, Mg: -2.37 };

/**
 * Lectura del voltímetro: la punta COM (negra) va al vaso izquierdo y la V (roja)
 * al derecho, así que marca E°(der) − E°(izq). Positiva solo si el ánodo está a la
 * izquierda; si se arma al revés, el voltímetro marca el negativo.
 */
export function lecturaVoltimetro(izq: string | null, der: string | null): number {
  if (!izq || !der) return 0;
  return parseFloat(((E0_REDUCCION[der] ?? 0) - (E0_REDUCCION[izq] ?? 0)).toFixed(2));
}

export function validarQ9(celda: CeldaState): Veredicto {
  const seed = celda.seedMetales ?? [];
  if (seed.length < 2) return { ok: false, mensaje: 'No hay metales en la estación.' };
  const montados = [celda.vasoIzq, celda.vasoDer];
  if (!seed.every((m) => montados.includes(m)) || celda.vasoIzq === celda.vasoDer) {
    return { ok: false, mensaje: 'Coloca un electrodo de cada metal, uno en cada vaso.' };
  }
  if (!celda.puenteSalino || !celda.cablesConectados) {
    return { ok: false, mensaje: 'Cierra el circuito: falta el puente salino o conectar el voltímetro.' };
  }
  const r = celda.respuesta;
  if (!r?.anodo || !r?.catodo) return { ok: false, mensaje: 'Indica cuál metal es el ánodo y cuál el cátodo.' };
  const [m1, m2] = seed;
  const anodo = (E0_REDUCCION[m1] ?? 0) < (E0_REDUCCION[m2] ?? 0) ? m1 : m2;
  const catodo = anodo === m1 ? m2 : m1;
  if (r.anodo !== anodo || r.catodo !== catodo) {
    return { ok: false, mensaje: 'La identificación no es correcta: el ánodo es el metal que se oxida (menor E° de reducción).' };
  }
  if (lecturaVoltimetro(celda.vasoIzq, celda.vasoDer) <= 0) {
    return { ok: false, mensaje: 'El voltímetro marca negativo: la punta COM (negra) debe ir al ánodo. Intercambia los electrodos.' };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Q10 — Destilación Fraccionada (etanol–agua a 1 atm)
// ─────────────────────────────────────────────────────────────────────────────
// Equilibrio líquido–vapor etanol–agua a 1 atm (fracciones molares de etanol) y
// temperatura de burbuja. Fuente: Perry's Chemical Engineers' Handbook (datos de
// Carey y Lewis, 1932). El azeótropo está en x = y = 0.894 (≈ 95.6 % m/m, 78.15 °C).
const VLE_X = [0, 0.019, 0.0721, 0.0966, 0.1238, 0.1661, 0.2337, 0.2608, 0.3273, 0.3965, 0.5079, 0.5198, 0.5732, 0.6763, 0.7472, 0.8943];
const VLE_Y = [0, 0.170, 0.3891, 0.4375, 0.4704, 0.5089, 0.5445, 0.5580, 0.5826, 0.6122, 0.6564, 0.6599, 0.6841, 0.7385, 0.7815, 0.8943];
const VLE_T = [100, 95.5, 89.0, 86.7, 85.3, 84.1, 82.7, 82.3, 81.5, 80.7, 79.8, 79.7, 79.3, 78.74, 78.41, 78.15];

// Volúmenes molares a 20 °C (mL/mol): etanol 46.07/0.789, agua 18.015/0.998.
const VM_ETANOL = 58.39;
const VM_AGUA = 18.05;

function interp(xs: number[], ys: number[], x: number): number {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
  }
  return ys[ys.length - 1];
}

/** Fracción molar de etanol en el vapor en equilibrio con el líquido x. */
export const yEquilibrio = (x: number) => interp(VLE_X, VLE_Y, x);
/** Temperatura de ebullición (burbuja) de la mezcla de fracción molar x (°C). */
export const tBurbuja = (x: number) => interp(VLE_X, VLE_T, x);

/**
 * Platos teóricos efectivos de la columna según el caudal de destilado (mL/s):
 * hervir suave deja que la columna separe (≈4 etapas); hervir fuerte la inunda (≈1).
 */
export function etapasEfectivas(tasa: number): number {
  return 1 + 3 * Math.exp(-tasa / 1.5);
}

/** Composición del destilado (fracción molar) a reflujo total con N etapas (escalera de McCabe–Thiele). */
export function composicionDestilado(xPot: number, N: number): number {
  let y = xPot;
  const enteras = Math.floor(N);
  for (let i = 0; i < enteras; i++) y = yEquilibrio(y);
  const frac = N - enteras;
  return frac > 0 ? y + frac * (yEquilibrio(y) - y) : y;
}

/** De fracción molar de etanol a fracción en volumen (% v/v ≈ grado alcohólico). */
export function fraccionVolumenEtanol(xMolar: number): number {
  const vE = xMolar * VM_ETANOL;
  const vW = (1 - xMolar) * VM_AGUA;
  return vE + vW > 0 ? vE / (vE + vW) : 0;
}

export function fraccionMolarDesdeVolumenes(volEtanol: number, volAgua: number): number {
  const nE = volEtanol / VM_ETANOL;
  const nW = volAgua / VM_AGUA;
  return nE + nW > 0 ? nE / (nE + nW) : 0;
}

export const K_TASA_Q10 = 0.15;          // mL/s por °C de sobrecalentamiento de la manta
export const TAU_CALENTAMIENTO_Q10 = 8;  // s
export const VOL_MINIMO_MATRAZ = 15;     // mL: por debajo, el matraz queda casi seco
export const VOL_REQUERIDO_Q10 = 50;     // mL
export const PUREZA_REQUERIDA_Q10 = 85;  // % v/v del destilado acumulado

/** Un paso de la simulación (dt en s). Pura: devuelve el nuevo estado. */
export function pasoDestilacion(d: DestilacionState, dt: number): DestilacionState {
  const volMatraz = d.volEtanolMatraz + d.volAguaMatraz;
  const xPot = fraccionMolarDesdeVolumenes(d.volEtanolMatraz, d.volAguaMatraz);
  const tb = tBurbuja(xPot);
  const seco = volMatraz < VOL_MINIMO_MATRAZ;

  // El líquido se calienta hacia la temperatura de la manta, pero no puede pasar de
  // su punto de ebullición: el calor sobrante se va en evaporar.
  const relax = 1 - Math.exp(-dt / TAU_CALENTAMIENTO_Q10);
  let temp = d.tempMezcla + (d.calorManta - d.tempMezcla) * relax;
  if (temp > tb) temp = tb;

  // Hierve cuando el líquido ya está en su punto de burbuja (con medio grado de
  // holgura: tb sube poco a poco a medida que el matraz pierde etanol).
  const hierve = !seco && d.tempMezcla >= tb - 0.5 && d.calorManta > tb;
  let tasa = 0, dV = 0, dVE = 0, cabeza = d.tempCabeza ?? 20;
  if (hierve) {
    tasa = K_TASA_Q10 * (d.calorManta - tb);
    const yD = composicionDestilado(xPot, etapasEfectivas(tasa));
    const phi = fraccionVolumenEtanol(yD);
    dV = Math.min(tasa * dt, volMatraz - VOL_MINIMO_MATRAZ + 1);
    dVE = Math.min(dV * phi, d.volEtanolMatraz);
    dV = dVE + Math.min(dV - dVE, d.volAguaMatraz);
    cabeza = tBurbuja(yD); // el vapor que llega a la cabeza condensa a su punto de rocío ≈ burbuja del destilado
    temp = tb;
  } else {
    cabeza = 20 + (cabeza - 20) * Math.exp(-dt / 20);
  }
  const volDestilado = d.volDestilado + dV;
  const volEtanolDest = (d.volEtanolDest ?? 0) + dVE;
  return {
    ...d,
    tempMezcla: temp,
    tempCabeza: cabeza,
    tasa,
    volEtanolMatraz: d.volEtanolMatraz - dVE,
    volAguaMatraz: d.volAguaMatraz - (dV - dVE),
    volDestilado,
    volEtanolDest,
    purezaDestilado: volDestilado > 0 ? (100 * volEtanolDest) / volDestilado : 0,
    status: d.status === 'success' || d.status === 'error' ? d.status : hierve ? 'boiling' : 'idle',
  };
}

export function validarQ10(d: DestilacionState): Veredicto {
  if (d.volDestilado < VOL_REQUERIDO_Q10) {
    return { ok: false, mensaje: `Colecta al menos ${VOL_REQUERIDO_Q10} mL de destilado.` };
  }
  if (d.purezaDestilado < PUREZA_REQUERIDA_Q10) {
    return { ok: false, mensaje: `El destilado acumulado no llega a ${PUREZA_REQUERIDA_Q10} % v/v de etanol: calentaste demasiado fuerte y la columna no alcanzó a separar. Repite con la manta apenas por encima de la ebullición.` };
  }
  return { ok: true };
}
