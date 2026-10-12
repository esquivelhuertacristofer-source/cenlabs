import { SimuladorState } from '@/store/types';

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

/** Veredicto de dominio: `ok` y, si falla, una pista que NO revela la respuesta. */
export interface VeredictoM { ok: boolean; mensaje?: string }

/**
 * Lee lo que el alumno escribe en un campo numérico. Acepta coma decimal
 * («3,61»): `parseFloat("3,61")` daba 3 y rechazaba un resultado correcto.
 * Cualquier texto que no sea un número completo devuelve NaN.
 */
export function leerNumero(texto: string | null | undefined): number {
  const t = String(texto ?? '').trim().replace(/\s/g, '');
  if (t === '') return NaN;
  const normal = t.includes(',') && !t.includes('.') ? t.replace(',', '.') : t;
  const v = Number(normal);
  return Number.isFinite(v) ? v : NaN;
}

const cerca = (a: number, b: number, tolRel: number) => Math.abs(a - b) <= tolRel * Math.abs(b);

// ════════════════════════════════════════════════════════════════════════════
// M1 — Ecuaciones cuadráticas: deducir f(x) = ax² + bx + c de la trayectoria
// ════════════════════════════════════════════════════════════════════════════
export const TOL_M1 = { a: 0.15, b: 0.3, c: 0.3 } as const;
/** Abscisas donde se «mide» la trayectoria objetivo (datos del problema). */
export const X_MEDIDAS_M1 = [-1, 0, 1] as const;

const fCuad = (a: number, b: number, c: number, x: number) => a * x * x + b * x + c;

/**
 * Tres puntos medidos de la trayectoria objetivo. Con x = −1, 0, 1 el sistema
 * sale directo: c = f(0), b = (f(1) − f(−1))/2, a = (f(1) + f(−1))/2 − c.
 */
export function puntosObjetivoM1(target: { a: number; b: number; c: number }) {
  return X_MEDIDAS_M1.map((x) => ({ x, y: Math.round(fCuad(target.a, target.b, target.c, x) * 100) / 100 }));
}

export function validarM1(cuadraticas: Pick<CuadraticasState, 'a' | 'b' | 'c' | 'target'>): boolean {
  const { a, b, c, target } = cuadraticas;
  return (
    Math.abs(a - target.a) < TOL_M1.a &&
    Math.abs(b - target.b) < TOL_M1.b &&
    Math.abs(c - target.c) < TOL_M1.c
  );
}

export function feedbackM1(cuadraticas: Pick<CuadraticasState, 'a' | 'b' | 'c' | 'target'>): string {
  const { a, b, c, target } = cuadraticas;
  if (Math.sign(a) !== Math.sign(target.a))
    return "Concavidad invertida: revisa el signo de 'a' con la forma de la trayectoria.";
  if (Math.abs(c - target.c) >= TOL_M1.c)
    return "Tu parábola no pasa por el punto medido en x = 0. ¿Qué coeficiente es f(0)?";
  if (Math.abs(a - target.a) >= TOL_M1.a)
    return "La apertura no coincide. Usa f(1) + f(−1) = 2a + 2c para despejar 'a'.";
  return "El eje de simetría está desplazado. Usa f(1) − f(−1) = 2b para despejar 'b'.";
}

// ════════════════════════════════════════════════════════════════════════════
// M2 — Sistemas 2×2 (intersección de rectas)
// ════════════════════════════════════════════════════════════════════════════
export const TOL_M2 = 0.1;
export type TipoSistemaM2 = 'unica' | 'inconsistente' | 'dependiente';

/** Clasifica el sistema: una solución, ninguna (paralelas) o infinitas (la misma recta). */
export function clasificarSistemaM2(m1: number, b1: number, m2: number, b2: number): TipoSistemaM2 {
  if (Math.abs(m1 - m2) >= 1e-3) return 'unica';
  return Math.abs(b1 - b2) < 1e-3 ? 'dependiente' : 'inconsistente';
}

export interface ValidarM2Result {
  isOk: boolean;
  interseccion?: { x: number; y: number };
}

export function validarM2(sistemas: Pick<Sistemas2x2State, 'm1' | 'b1' | 'm2' | 'b2' | 'target'>): ValidarM2Result {
  const { m1, b1, m2, b2, target } = sistemas;
  if (clasificarSistemaM2(m1, b1, m2, b2) !== 'unica') return { isOk: false };
  const xi = (b2 - b1) / (m1 - m2);
  const yi = m1 * xi + b1;
  const isOk = Math.abs(xi - target.x) < TOL_M2 && Math.abs(yi - target.y) < TOL_M2;
  return { isOk, interseccion: { x: xi, y: yi } };
}

export function evaluarM2(s: Pick<Sistemas2x2State, 'm1' | 'b1' | 'm2' | 'b2' | 'target'>): VeredictoM {
  const tipo = clasificarSistemaM2(s.m1, s.b1, s.m2, s.b2);
  if (tipo === 'dependiente') return { ok: false, mensaje: 'Las dos rectas son la MISMA (sistema dependiente: infinitas soluciones). Cambia una pendiente.' };
  if (tipo === 'inconsistente') return { ok: false, mensaje: 'Rectas paralelas (sistema inconsistente): no se cortan. Cambia una pendiente.' };
  const r = validarM2(s);
  if (r.isOk) return { ok: true };
  return { ok: false, mensaje: `Tus rectas se cortan en (${r.interseccion!.x.toFixed(2)}, ${r.interseccion!.y.toFixed(2)}); el objetivo pide un error menor a ${TOL_M2} en cada coordenada.` };
}

// ════════════════════════════════════════════════════════════════════════════
// M3 — Magnitud de momento (Mw) y logaritmos
// Energía sísmica radiada: log₁₀ E = 1.5·Mw + 4.8 (E en joules; Gutenberg–Richter,
// 1956; Kanamori, 1977). Por eso E₂/E₁ = 10^(1.5·ΔM): cada grado ≈ ×31.6.
// ════════════════════════════════════════════════════════════════════════════
export const TOL_REL_M3 = 0.05;

/** Sismos del reto (Mw). Fuentes: USGS ComCat; CDMX 1985: SSN (UNAM) reporta Mw 8.1. */
export const SISMOS_M3 = [
  { id: 'simulacion_libre', target: 8.0, nombre: 'Sismo hipotético', anio: null },
  { id: 'valdivia_1960', target: 9.5, nombre: 'Valdivia, Chile', anio: 1960 },
  { id: 'cdmx_1985', target: 8.1, nombre: 'Ciudad de México', anio: 1985 },
  { id: 'tohoku_2011', target: 9.1, nombre: 'Tōhoku, Japón', anio: 2011 },
  { id: 'haiti_2010', target: 7.0, nombre: 'Haití', anio: 2010 },
  { id: 'sumatra_2004', target: 9.1, nombre: 'Sumatra–Andamán', anio: 2004 },
  { id: 'sanfrancisco_1906', target: 7.9, nombre: 'San Francisco, EE. UU.', anio: 1906 },
] as const;

export const factorEnergiaM3 = (mObjetivo: number, mBase: number) => Math.pow(10, 1.5 * (mObjetivo - mBase));

export function validarM3(richter: Pick<RichterState, 'targetM' | 'magnitudBase' | 'userInputFactor'>): boolean {
  return evaluarM3(richter).ok;
}

export function evaluarM3(richter: Pick<RichterState, 'targetM' | 'magnitudBase' | 'userInputFactor'>): VeredictoM {
  const real = factorEnergiaM3(richter.targetM, richter.magnitudBase);
  const v = leerNumero(richter.userInputFactor);
  if (!Number.isFinite(v) || v <= 0) return { ok: false, mensaje: 'Escribe el factor de energía como un número positivo (p. ej. 1250 o 1,25e3).' };
  if (cerca(v, real, TOL_REL_M3)) return { ok: true };
  const dM = richter.targetM - richter.magnitudBase;
  if (cerca(v, Math.pow(10, dM), TOL_REL_M3))
    return { ok: false, mensaje: 'Ese es el factor de AMPLITUD (10^ΔM). La energía crece más rápido: usa el exponente 1.5·ΔM.' };
  if (cerca(v, 1.5 * dM, TOL_REL_M3))
    return { ok: false, mensaje: 'Ese número es el EXPONENTE. El factor es 10 elevado a ese exponente.' };
  return { ok: false, mensaje: 'El factor no coincide (tolerancia ±5 %). Revisa ΔM = M_objetivo − M_base y calcula 10^(1.5·ΔM).' };
}

// ════════════════════════════════════════════════════════════════════════════
// M4 — Teorema de Pitágoras
// ════════════════════════════════════════════════════════════════════════════
export const TOL_M4 = 0.1;
export const CATETO_MIN_M4 = 1;
export const CATETO_MAX_M4 = 10;

export function validarM4(p: Pick<PitaGorasState, 'catetoA' | 'catetoB' | 'userInputC' | 'llenado'>): boolean {
  return evaluarM4(p).ok;
}

export function evaluarM4(p: Pick<PitaGorasState, 'catetoA' | 'catetoB' | 'userInputC' | 'llenado'>): VeredictoM {
  if ((p.llenado ?? 0) < 100) return { ok: false, mensaje: 'Primero vierte el fluido: la demostración por áreas es parte de la práctica.' };
  const v = leerNumero(p.userInputC);
  if (!Number.isFinite(v)) return { ok: false, mensaje: 'Escribe la longitud de la hipotenusa c como número.' };
  const c = Math.hypot(p.catetoA, p.catetoB);
  if (Math.abs(v - c) < TOL_M4) return { ok: true };
  if (Math.abs(v - (p.catetoA ** 2 + p.catetoB ** 2)) < TOL_M4)
    return { ok: false, mensaje: 'Ese valor es c² (el área del cuadrado grande). La hipotenusa es su raíz cuadrada.' };
  if (Math.abs(v - (p.catetoA + p.catetoB)) < TOL_M4)
    return { ok: false, mensaje: 'c no es a + b: el camino recto es más corto que ir por los dos catetos. Usa a² + b² = c².' };
  return { ok: false, mensaje: `c no coincide (tolerancia ±${TOL_M4}). Calcula a² + b² y saca la raíz cuadrada.` };
}

// ════════════════════════════════════════════════════════════════════════════
// M5 — Círculo trigonométrico: resolver sen θ = v (o cos θ = v) en [0°, 360°)
// ════════════════════════════════════════════════════════════════════════════
export type FuncionTrigM5 = 'sen' | 'cos';
export interface ObjetivoM5 { funcion: FuncionTrigM5; valor: number; texto: string }

/** Valores notables con DOS soluciones en [0°, 360°) (se excluyen ±1). */
export const VALORES_NOTABLES_M5: Array<{ valor: number; texto: string }> = [
  { valor: 0, texto: '0' },
  { valor: 0.5, texto: '1/2' }, { valor: -0.5, texto: '−1/2' },
  { valor: Math.SQRT1_2, texto: '√2/2' }, { valor: -Math.SQRT1_2, texto: '−√2/2' },
  { valor: Math.sqrt(3) / 2, texto: '√3/2' }, { valor: -Math.sqrt(3) / 2, texto: '−√3/2' },
];

const norm360 = (g: number) => ((Math.round(g) % 360) + 360) % 360;
const distAng = (a: number, b: number) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(d, 360 - d); };

/** Las dos soluciones en grados enteros de [0, 360). */
export function solucionesM5(o: Pick<ObjetivoM5, 'funcion' | 'valor'>): [number, number] {
  const r2g = 180 / Math.PI;
  if (o.funcion === 'sen') {
    const t = Math.asin(o.valor) * r2g;           // en [−90°, 90°]
    return [norm360(t), norm360(180 - t)];
  }
  const t = Math.acos(o.valor) * r2g;             // en [0°, 180°]
  return [norm360(t), norm360(360 - t)];
}

const cumpleM5 = (o: ObjetivoM5, ang: number) => solucionesM5(o).some((s) => distAng(s, ang) < 0.5);

export function validarM5(trig: Pick<TrigonometriaState, 'hallazgos' | 'objetivo'>): boolean {
  return evaluarM5(trig).ok;
}

export function evaluarM5(trig: Pick<TrigonometriaState, 'hallazgos' | 'objetivo'>): VeredictoM {
  const o = trig.objetivo;
  if (!o) return { ok: false, mensaje: 'No hay ecuación asignada. Reinicia la práctica.' };
  const hs = trig.hallazgos ?? [];
  const ec = `${o.funcion} θ = ${o.texto}`;
  if (hs.length === 0) return { ok: false, mensaje: `Captura los ángulos que cumplen ${ec}.` };
  const malos = hs.filter((h) => !cumpleM5(o, h.angulo));
  if (malos.length) return { ok: false, mensaje: `Capturaste ${malos.map((h) => `${h.angulo}°`).join(', ')}, que no cumple ${ec}. Limpia las muestras y vuelve a intentarlo.` };
  const [s1, s2] = solucionesM5(o);
  const tiene = (s: number) => hs.some((h) => distAng(h.angulo, s) < 0.5);
  if (!tiene(s1) || !tiene(s2)) return { ok: false, mensaje: `${ec} tiene DOS soluciones en una vuelta. Te falta una: piensa en qué otro cuadrante la proyección vale lo mismo.` };
  return { ok: true };
}

// ════════════════════════════════════════════════════════════════════════════
// M6 — Transformaciones geométricas (T·R·S)
// ════════════════════════════════════════════════════════════════════════════
export const TOL_M6 = { t: 0.2, rot: 5, escala: 0.1 } as const;
export const RANGO_T_M6 = 5;            // los sliders de traslación van de −5 a 5
export const ESCALA_MIN_M6 = 0.5;
export const ESCALA_MAX_M6 = 2;

/** Diferencia angular mínima en grados (0° y 360° son la misma orientación). */
export const difAnguloM6 = (a: number, b: number) => distAng(a, b);

/** Matriz homogénea 3×3 de M = T·R·S (primero escala, luego rota, luego traslada). */
export function matrizM6(tx: number, ty: number, rotacionGrados: number, s: number): number[][] {
  const r = (rotacionGrados * Math.PI) / 180;
  const c = Math.cos(r) * s, sn = Math.sin(r) * s;
  return [[c, -sn, tx], [sn, c, ty], [0, 0, 1]];
}

export function validarM6(geo: Pick<Geometria6State, 'tx' | 'ty' | 'rotacion' | 'escala' | 'target'>): boolean {
  return evaluarM6(geo).ok;
}

export function evaluarM6(geo: Pick<Geometria6State, 'tx' | 'ty' | 'rotacion' | 'escala' | 'target'>): VeredictoM {
  const fallos: string[] = [];
  if (Math.abs(geo.escala - geo.target.escala) >= TOL_M6.escala) fallos.push('la escala');
  if (difAnguloM6(geo.rotacion, geo.target.rotacion) >= TOL_M6.rot) fallos.push('la rotación');
  if (Math.abs(geo.tx - geo.target.tx) >= TOL_M6.t || Math.abs(geo.ty - geo.target.ty) >= TOL_M6.t) fallos.push('la traslación');
  if (!fallos.length) return { ok: true };
  return { ok: false, mensaje: `La nave no coincide con la silueta objetivo: revisa ${fallos.join(', ')}.` };
}

// ════════════════════════════════════════════════════════════════════════════
// M7 — Ley de Snell: n₁·sen θ₁ = n₂·sen θ₂
// ════════════════════════════════════════════════════════════════════════════
export const TOL_M7 = 0.05;
export const ANGULO_MIN_M7 = 10;
export const ANGULO_MAX_M7 = 80;

/** Ángulo de refracción (grados); null si hay reflexión total interna. */
export function anguloRefraccionM7(n1: number, n2: number, theta1Grados: number): number | null {
  const s = (n1 / n2) * Math.sin((theta1Grados * Math.PI) / 180);
  if (s > 1) return null;
  return (Math.asin(s) * 180) / Math.PI;
}

export function validarM7(optica: Pick<Optica7State, 'userInputN2' | 'n2Misterio'>): boolean {
  return Math.abs(leerNumero(optica.userInputN2) - optica.n2Misterio) <= TOL_M7;
}

export function evaluarM7(optica: Pick<Optica7State, 'userInputN2' | 'n2Misterio' | 'n1' | 'anguloIncidencia'>): VeredictoM {
  const v = leerNumero(optica.userInputN2);
  if (!Number.isFinite(v)) return { ok: false, mensaje: 'Escribe el índice n₂ como número (p. ej. 1.52).' };
  if (validarM7(optica)) return { ok: true };
  if (v > 0 && Math.abs(1 / v - optica.n2Misterio) <= TOL_M7)
    return { ok: false, mensaje: 'Invertiste el cociente: n₂ = n₁·sen θ₁ / sen θ₂.' };
  if (v < 1) return { ok: false, mensaje: 'Ningún medio material tiene n < 1 (la luz no va más rápido que en el vacío). Revisa el cociente.' };
  return { ok: false, mensaje: `n₂ no coincide (tolerancia ±${TOL_M7}). Usa los SENOS de los ángulos medidos desde la normal, no los ángulos.` };
}

// ════════════════════════════════════════════════════════════════════════════
// M8 — La derivada: instante de velocidad máxima de un cohete
// s(t) = −k·t³ + m·t²  →  v(t) = s'(t) = −3k·t² + 2m·t  →  a(t) = v'(t) = −6k·t + 2m
// v es máxima donde a(t) = 0: t* = m / (3k) (punto de inflexión de s).
// ════════════════════════════════════════════════════════════════════════════
export const TOL_M8 = 0.2;
export const T_MAX_M8 = 10;
export interface CoheteM8 { k: number; m: number }

export const posicionM8 = (c: CoheteM8, t: number) => -c.k * t ** 3 + c.m * t ** 2;
export const velocidadM8 = (c: CoheteM8, t: number) => -3 * c.k * t ** 2 + 2 * c.m * t;
export const aceleracionM8 = (c: CoheteM8, t: number) => -6 * c.k * t + 2 * c.m;
export const tVelocidadMaximaM8 = (c: CoheteM8) => c.m / (3 * c.k);

export function validarM8(d: Pick<Derivada8State, 'xActual' | 'k' | 'm'>): boolean {
  return Math.abs(d.xActual - tVelocidadMaximaM8(d)) <= TOL_M8;
}

export function evaluarM8(d: Pick<Derivada8State, 'xActual' | 'k' | 'm'>): VeredictoM {
  if (validarM8(d)) return { ok: true };
  if (Math.abs(velocidadM8(d, d.xActual)) < 0.3)
    return { ok: false, mensaje: 'En ese instante la velocidad es casi cero: es un reposo, no la velocidad máxima.' };
  return { ok: false, mensaje: 'Ese no es el instante de velocidad máxima. Deriva s(t) para obtener v(t) y vuelve a derivar: v es máxima cuando v\'(t) = 0.' };
}

// ════════════════════════════════════════════════════════════════════════════
// M9 — Sumas de Riemann de f(x) = 0.1·x² + 1 en [0, 10]
// Integral exacta: ∫₀¹⁰ (0.1x² + 1) dx = [x³/30 + x]₀¹⁰ = 100/3 + 10 = 130/3 ≈ 43.333.
// f es creciente y convexa: izquierda subestima, derecha sobreestima y punto
// medio subestima muy poco (error exacto = (b−a)·Δx²·f''/24 = Δx²/12).
// ════════════════════════════════════════════════════════════════════════════
export type MetodoM9 = 'izquierda' | 'derecha' | 'punto_medio';
export const A_M9 = 0;
export const B_M9 = 10;
export const fM9 = (x: number) => 0.1 * x * x + 1;
export const INTEGRAL_EXACTA_M9 = 130 / 3;
export const N_MIN_M9 = 4;
export const N_MAX_M9 = 100;
/** Error relativo máximo aceptado según el método del reto (fracción). */
export const TOLERANCIA_M9: Record<MetodoM9, number> = { izquierda: 0.02, derecha: 0.02, punto_medio: 0.001 };
export const NOMBRE_METODO_M9: Record<MetodoM9, string> = { izquierda: 'extremos izquierdos', derecha: 'extremos derechos', punto_medio: 'puntos medios' };

export const puntoEvaluacionM9 = (i: number, n: number, metodo: MetodoM9) => {
  const dx = (B_M9 - A_M9) / n;
  const off = metodo === 'izquierda' ? 0 : metodo === 'derecha' ? 1 : 0.5;
  return A_M9 + (i + off) * dx;
};

export function sumaRiemannM9(n: number, metodo: MetodoM9): number {
  const dx = (B_M9 - A_M9) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += fM9(puntoEvaluacionM9(i, n, metodo)) * dx;
  return s;
}

export const errorRelativoM9 = (n: number, metodo: MetodoM9) =>
  Math.abs(sumaRiemannM9(n, metodo) - INTEGRAL_EXACTA_M9) / INTEGRAL_EXACTA_M9;

export function validarM9(i: Pick<Integral9State, 'n' | 'metodo' | 'metodoReto'>): boolean {
  return evaluarM9(i).ok;
}

export function evaluarM9(i: Pick<Integral9State, 'n' | 'metodo' | 'metodoReto'>): VeredictoM {
  const tol = TOLERANCIA_M9[i.metodoReto];
  if (i.metodo !== i.metodoReto)
    return { ok: false, mensaje: `El reto pide sumas por ${NOMBRE_METODO_M9[i.metodoReto]}.` };
  const e = errorRelativoM9(i.n, i.metodo);
  if (e < tol) return { ok: true };
  return { ok: false, mensaje: `Con n = ${i.n} el error relativo es ${(e * 100).toFixed(2)} %; el reto pide menos de ${(tol * 100).toFixed(1)} %. Refina la partición.` };
}

// ════════════════════════════════════════════════════════════════════════════
// M10 — Máquina de Galton: Binomial(10, p) y su aproximación normal
// ════════════════════════════════════════════════════════════════════════════
export const FILAS_M10 = 10;
export const MUESTRA_MIN_M10 = 200;
export const TOL_PREDICCION_M10 = 0.05;
/**
 * Valores críticos de χ² con α = 0.001 (cola superior), gl = 1…10.
 * Fuente: NIST/SEMATECH e-Handbook of Statistical Methods, tabla 1.3.6.7.4.
 * Con α tan pequeño, una muestra honesta casi nunca se rechaza (1 en 1000).
 */
export const CHI2_CRITICO_001_M10 = [10.828, 13.816, 16.266, 18.467, 20.515, 22.458, 24.322, 26.124, 27.877, 29.588];

function binom(n: number, k: number) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}
export const pmfBinomialM10 = (k: number, p: number, n = FILAS_M10) => binom(n, k) * p ** k * (1 - p) ** (n - k);
export const mediaTeoricaM10 = (p: number) => FILAS_M10 * p;
export const sigmaTeoricaM10 = (p: number) => Math.sqrt(FILAS_M10 * p * (1 - p));

export function estadisticaMuestraM10(cont: number[]) {
  const N = cont.reduce((a, b) => a + b, 0);
  if (!N) return { N, media: NaN, sigma: NaN };
  const media = cont.reduce((s, c, k) => s + c * k, 0) / N;
  const varz = cont.reduce((s, c, k) => s + c * (k - media) ** 2, 0) / N;
  return { N, media, sigma: Math.sqrt(varz) };
}

/** Prueba χ² de bondad de ajuste contra Binomial(10, p), agrupando clases con esperado < 5. */
export function chiCuadradaM10(cont: number[], p: number) {
  const N = cont.reduce((a, b) => a + b, 0);
  const grupos: Array<{ o: number; e: number }> = [];
  let o = 0, e = 0;
  for (let k = 0; k <= FILAS_M10; k++) {
    o += cont[k] ?? 0; e += N * pmfBinomialM10(k, p);
    if (e >= 5) { grupos.push({ o, e }); o = 0; e = 0; }
  }
  if (e > 0 || o > 0) {
    if (grupos.length) { grupos[grupos.length - 1].o += o; grupos[grupos.length - 1].e += e; }
    else grupos.push({ o, e });
  }
  const chi2 = grupos.reduce((s, g) => s + (g.e > 0 ? (g.o - g.e) ** 2 / g.e : 0), 0);
  const gl = Math.max(1, grupos.length - 1);
  return { chi2, gl, critico: CHI2_CRITICO_001_M10[Math.min(gl, 10) - 1] };
}

export function validarM10(g: Pick<Galton10State, 'contenedores' | 'probabilidad' | 'prediccionMedia' | 'prediccionSigma'>): boolean {
  return evaluarM10(g).ok;
}

export function evaluarM10(g: Pick<Galton10State, 'contenedores' | 'probabilidad' | 'prediccionMedia' | 'prediccionSigma'>): VeredictoM {
  const N = g.contenedores.reduce((a, b) => a + b, 0);
  if (N < MUESTRA_MIN_M10) return { ok: false, mensaje: `La muestra tiene ${N} bolitas; se necesitan al menos ${MUESTRA_MIN_M10}.` };
  const mu = leerNumero(g.prediccionMedia);
  const sg = leerNumero(g.prediccionSigma);
  if (!Number.isFinite(mu) || !Number.isFinite(sg)) return { ok: false, mensaje: 'Escribe tu predicción teórica de la media μ y la desviación σ del contenedor final.' };
  if (Math.abs(mu - mediaTeoricaM10(g.probabilidad)) > TOL_PREDICCION_M10)
    return { ok: false, mensaje: 'Tu μ teórica no coincide. Cada bolita decide 10 veces con probabilidad p de ir a la derecha.' };
  if (Math.abs(sg - sigmaTeoricaM10(g.probabilidad)) > TOL_PREDICCION_M10)
    return { ok: false, mensaje: 'Tu σ teórica no coincide. Para una binomial, σ² = n·p·(1 − p).' };
  const { chi2, critico } = chiCuadradaM10(g.contenedores, g.probabilidad);
  if (chi2 > critico)
    return { ok: false, mensaje: 'El histograma no se ajusta a la binomial de esta p (χ² demasiado grande). Vacía la máquina y repite la muestra.' };
  return { ok: true };
}
