/**
 * Dominio de los 10 labs de física: física pura (sin React ni store) y los
 * validadores. Regla de la casa: el validador evalúa el RETO del lab leyendo el
 * estado que el panel escribe en el store, y el panel usa estas mismas funciones
 * para su feedback —nunca una regla propia distinta—.
 *
 * Todas las magnitudes en SI salvo donde el nombre diga otra cosa (`_cm`, `_mm`,
 * `μC`). Los datos tabulados llevan su fuente al lado.
 */

/** Veredicto de un lab: `ok` y, si falla, qué decirle al alumno (sin revelar la respuesta). */
export interface Veredicto { ok: boolean; mensaje?: string }

const OK: Veredicto = { ok: true };
const no = (mensaje: string): Veredicto => ({ ok: false, mensaje });

/** g estándar en la superficie terrestre (m/s²). */
export const G_TIERRA = 9.81;

const relErr = (medido: number, real: number) => Math.abs(medido - real) / Math.abs(real);
const finito = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

// ─────────────────────────────────────────────────────────────────────────────
// Cronometraje a mano (F3 y F4)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Un cronómetro manual tiene un error de reacción de ~0,1 s al arrancar y otro
 * al parar: en el peor caso Δt ≈ 0,2 s sobre el tiempo TOTAL medido. Si se
 * cronometran n oscilaciones, T = t/n y ΔT = 0,2/n, así que el error relativo es
 * ΔT/T = 0,2/(n·T). El periodo más corto de estos labs es 0,81 s (resorte con
 * m = 1 kg y k = 60 N/m); con n = 10, ΔT/T ≤ 0,2/8,1 = 2,5 %. Por eso:
 *   · cada muestra exige n ≥ 10 oscilaciones y se acepta con ±6 % sobre T;
 *   · g = 4π²L/T² y k = 4π²m/T² heredan el DOBLE del error relativo de T
 *     (≤ 5 % en el peor caso), y el resultado final se acepta con ±5 %
 *     (el promedio de varias muestras reduce ese error en la práctica).
 * Con una sola oscilación (ΔT/T hasta 16 %) el reto no sería alcanzable: por eso
 * se pide medir varias.
 */
export const OSCILACIONES_MIN = 10;
export const TOL_MUESTRA_PERIODO = 0.06;
export const TOL_RESULTADO_CRONO = 0.05;

export interface MuestraCrono { n: number; t: number }

/** Periodo medido a partir de n oscilaciones en t segundos (NaN si no es válida). */
export function periodoMedido(m: MuestraCrono): number {
  if (!finito(m.n) || !finito(m.t) || m.n <= 0 || m.t <= 0) return NaN;
  return m.t / m.n;
}

/** ¿La muestra cronometrada es coherente con el periodo real? */
export function muestraCronoValida(m: MuestraCrono, Treal: number): boolean {
  const T = periodoMedido(m);
  return m.n >= OSCILACIONES_MIN && Number.isFinite(T) && relErr(T, Treal) <= TOL_MUESTRA_PERIODO;
}

// ═════════════════════════════════════════════════════════════════════════════
// F1 — Tiro parabólico con arrastre y viento
// ═════════════════════════════════════════════════════════════════════════════
export type Escenario = 'tierra' | 'luna' | 'marte' | 'jupiter';

/**
 * Gravedad y densidad atmosférica de cada escenario.
 * Fuente: NASA Planetary Fact Sheets (nssdc.gsfc.nasa.gov/planetary/factsheet):
 *   g: Tierra 9.81, Luna 1.62, Marte 3.71, Júpiter 24.79 m/s².
 *   ρ: Tierra 1.225 kg/m³ (atmósfera estándar ISA a nivel del mar); Marte ≈ 0.020;
 *      Luna sin atmósfera; Júpiter 0.16 kg/m³ en el nivel de 1 bar (no tiene suelo:
 *      el "polígono" de Júpiter es un escenario hipotético en ese nivel).
 * `vientoMax`: ráfaga máxima del escenario (m/s), valor didáctico.
 */
export const ESCENARIOS: Record<Escenario, { g: number; rho: number; vientoMax: number; nombre: string }> = {
  tierra:  { g: 9.81,  rho: 1.225, vientoMax: 6,  nombre: 'Tierra' },
  luna:    { g: 1.62,  rho: 0,     vientoMax: 0,  nombre: 'Luna' },
  marte:   { g: 3.71,  rho: 0.020, vientoMax: 20, nombre: 'Marte' },
  jupiter: { g: 24.79, rho: 0.16,  vientoMax: 25, nombre: 'Júpiter' },
};

/**
 * Proyectil: esfera de 1 kg y 12 cm de diámetro con Cd = 0,47 (esfera lisa,
 * régimen subcrítico). El arrastre cuadrático por unidad de masa es
 * a = −(ρ·Cd·A / 2m)·|v_rel|·v_rel, con v_rel = v − v_viento (el viento sopla en x).
 */
export const PROYECTIL = { masa: 1, diametro: 0.12, cd: 0.47 };
export function coefArrastre(rho: number): number {
  const A = Math.PI * (PROYECTIL.diametro / 2) ** 2;
  return (rho * PROYECTIL.cd * A) / (2 * PROYECTIL.masa); // 1/m
}

/** Tolerancia de impacto: radio de la diana (m). */
export const RADIO_DIANA = 2.5;
export const MUNICION_POR_MISION = 3;
export const RANGO_ANGULO = { min: 0, max: 90, paso: 1 };
export const RANGO_VELOCIDAD = { min: 0, max: 100, paso: 1 };

export interface Mision1 {
  escenario: Escenario; targetX: number; y0: number; obsX: number; obsY: number; viento: number;
}
export interface Disparo1 { angulo: number; velocidad: number }
export interface MuestraTiro { x: number; y: number; vx: number; vy: number; t: number }
export interface ResultadoTiro {
  resultado: 'exito' | 'fallo' | 'colision';
  hitX: number; yImpacto: number; t: number; maxY: number; muestras: MuestraTiro[];
}

/**
 * Integra el disparo (Euler semi-implícito, dt = 0,01 s) hasta que toca el suelo,
 * choca con el muro o pasan 60 s. El cruce con el muro y con el suelo se
 * interpola entre pasos, así que el proyectil no puede «atravesar» el muro.
 */
export function simularDisparo(m: Mision1, d: Disparo1, conMuestras = false): ResultadoTiro {
  const { g, rho } = ESCENARIOS[m.escenario] ?? ESCENARIOS.tierra;
  const K = coefArrastre(rho);
  const rad = (d.angulo * Math.PI) / 180;
  const dt = 0.01;
  let x = 0, y = m.y0, t = 0;
  let vx = d.velocidad * Math.cos(rad);
  let vy = d.velocidad * Math.sin(rad);
  let maxY = y;
  const muestras: MuestraTiro[] = [];
  if (conMuestras) muestras.push({ x, y, vx, vy, t });

  while (t < 60) {
    const rx = vx - m.viento;
    const rv = Math.hypot(rx, vy);
    vx += -K * rv * rx * dt;
    vy += (-g - K * rv * vy) * dt;
    const px = x, py = y;
    x += vx * dt; y += vy * dt; t += dt;
    if (y > maxY) maxY = y;

    // ¿cruza el plano del muro en este paso?
    if ((px - m.obsX) * (x - m.obsX) <= 0 && px !== x) {
      const f = (m.obsX - px) / (x - px);
      const yMuro = py + f * (y - py);
      if (yMuro <= m.obsY && yMuro >= 0) {
        if (conMuestras) muestras.push({ x: m.obsX, y: yMuro, vx, vy, t: t - dt + f * dt });
        return { resultado: 'colision', hitX: m.obsX, yImpacto: yMuro, t, maxY, muestras };
      }
    }
    if (y <= 0) {
      const f = py / (py - y);
      const hitX = px + f * (x - px);
      if (conMuestras) muestras.push({ x: hitX, y: 0, vx, vy, t: t - dt + f * dt });
      const resultado = Math.abs(hitX - m.targetX) <= RADIO_DIANA ? 'exito' : 'fallo';
      return { resultado, hitX, yImpacto: 0, t, maxY, muestras };
    }
    if (conMuestras && Math.round(t / dt) % 2 === 0) muestras.push({ x, y, vx, vy, t });
  }
  return { resultado: 'fallo', hitX: x, yImpacto: y, t, maxY, muestras };
}

/** Duración de la animación de un disparo (ms); la usan el store y la escena. */
export function duracionAnimacionMs(tVuelo: number): number {
  return Math.min(3000, Math.max(800, tVuelo * 450));
}

/** Semilla de misión: posiciones de diana y muro, altura del cañón y viento. */
export function generarMision1(escenario: Escenario, rnd: () => number = Math.random): Mision1 {
  const ent = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a;
  const targetX = ent(50, 85);
  const y0 = ent(10, 35);
  const obsX = ent(15, targetX - 25);
  const obsY = ent(10, 30);
  const vmax = ESCENARIOS[escenario]?.vientoMax ?? 0;
  const viento = Math.round((rnd() * 2 - 1) * vmax * 10) / 10;
  return { escenario, targetX, y0, obsX, obsY, viento };
}

/** El reto: al menos un impacto confirmado en este intento. */
export function evaluarF1(tiro1: { aciertos?: number }): Veredicto {
  if ((tiro1.aciertos ?? 0) > 0) return OK;
  return no('Aún no hay impacto confirmado en la diana. Ajusta ángulo y velocidad con la ecuación de la trayectoria y dispara.');
}

// ═════════════════════════════════════════════════════════════════════════════
// F2 — Segunda ley de Newton en un plano inclinado con fricción
// ═════════════════════════════════════════════════════════════════════════════
export const LONGITUD_RAMPA = 10;   // m
export const POS_INICIAL_RAMPA = 5; // m (el bloque parte del centro y puede subir o bajar)
export const TOL_ACELERACION = 0.1; // m/s²

export interface ParamsPlano { angulo: number; empuje: number; masa: number; muS: number; muK: number }
export interface DinamicaPlano {
  W: number; Wx: number; N: number; fsMax: number; fk: number;
  /** Aceleración a lo largo del plano, positiva hacia ARRIBA. */
  a: number;
  estado: 'reposo' | 'sube' | 'baja';
}

/**
 * Bloque de masa m sobre un plano de ángulo θ con una fuerza F paralela al plano
 * (positiva hacia arriba). Mientras está en reposo, la fricción estática lo
 * sostiene si |F − m·g·sinθ| ≤ μs·N. Si se mueve, la fricción cinética μk·N se
 * opone al movimiento. Como las fuerzas son constantes, un bloque que arranca
 * acelera siempre en el mismo sentido (μk < μs): movimiento uniformemente acelerado.
 */
export function dinamicaPlano(p: ParamsPlano): DinamicaPlano {
  const rad = (p.angulo * Math.PI) / 180;
  const W = p.masa * G_TIERRA;
  const Wx = W * Math.sin(rad);
  const N = W * Math.cos(rad);
  const fsMax = p.muS * N;
  const fk = p.muK * N;
  const motriz = p.empuje - Wx;
  if (Math.abs(motriz) <= fsMax) return { W, Wx, N, fsMax, fk, a: 0, estado: 'reposo' };
  const dir = Math.sign(motriz);
  return { W, Wx, N, fsMax, fk, a: (motriz - dir * fk) / p.masa, estado: dir > 0 ? 'sube' : 'baja' };
}

export function evaluarF2(plano2: { ensayo: (ParamsPlano & { prediccion: number }) | null }): Veredicto {
  const e = plano2.ensayo;
  if (!e) return no('Primero escribe tu predicción de la aceleración y lanza un ensayo.');
  if (!finito(e.prediccion)) return no('Tu predicción no es un número válido.');
  const din = dinamicaPlano(e);
  if (din.estado === 'reposo') return no('En tu último ensayo el bloque no se movió. Ajusta la fuerza o el ángulo para vencer la fricción estática y repite.');
  if (Math.abs(e.prediccion - din.a) > TOL_ACELERACION) {
    return no('Tu predicción no coincide con la aceleración medida (tolerancia ±0.1 m/s²). Revisa el diagrama de cuerpo libre: componente del peso, normal, sentido de la fricción cinética y signos.');
  }
  return OK;
}

/** Semilla: coeficientes de fricción del par de superficies (μs = μk + 0,10). */
export function generarFriccion2(rnd: () => number = Math.random) {
  const muK = [0.15, 0.2, 0.25, 0.3, 0.35][Math.floor(rnd() * 5)];
  return { muK, muS: Math.round((muK + 0.1) * 100) / 100 };
}

// ═════════════════════════════════════════════════════════════════════════════
// F3 — Péndulo simple: medir g
// ═════════════════════════════════════════════════════════════════════════════
export function periodoPendulo(L: number, g: number): number {
  return 2 * Math.PI * Math.sqrt(L / g);
}

export interface MuestraPendulo extends MuestraCrono { L: number; m: number }

/** g «misteriosa» del intento, entre la de Marte y la de Júpiter (m/s²). */
export function generarGravedad3(rnd: () => number = Math.random): number {
  return Math.round((3.7 + rnd() * (24.7 - 3.7)) * 100) / 100;
}

export function evaluarF3(p: { gSemilla: number; muestras: MuestraPendulo[]; gAlumno: number | null }): Veredicto {
  const validas = p.muestras.filter((s) => muestraCronoValida(s, periodoPendulo(s.L, p.gSemilla)));
  if (p.muestras.length > validas.length) {
    return no(`Hay muestras incoherentes con el péndulo. Cronometra al menos ${OSCILACIONES_MIN} oscilaciones completas por muestra y anota cuántas fueron.`);
  }
  const Ls = new Set(validas.map((s) => s.L));
  if (Ls.size < 3) return no('Necesitas muestras con al menos 3 longitudes distintas para estudiar T frente a L.');
  const masaIndep = validas.some((a) => validas.some((b) => a.L === b.L && a.m !== b.m));
  if (!masaIndep) return no('Falta comprobar la independencia de la masa: mide dos masas distintas con la MISMA longitud.');
  if (!finito(p.gAlumno)) return no('Calcula g con tus datos (g = 4π²L/T²) y escríbela.');
  if (relErr(p.gAlumno, p.gSemilla) > TOL_RESULTADO_CRONO) return no('Tu valor de g no coincide con tus mediciones (tolerancia ±5 %). Recalcula T = t/n y promedia tus muestras.');
  return OK;
}

// ═════════════════════════════════════════════════════════════════════════════
// F4 — Ley de Hooke: k por el método estático y por el dinámico
// ═════════════════════════════════════════════════════════════════════════════
export function elongacionEquilibrio(m: number, k: number): number { return (m * G_TIERRA) / k; }
export function periodoResorte(m: number, k: number): number { return 2 * Math.PI * Math.sqrt(m / k); }
/** La regla del soporte se lee al milímetro. */
export function lecturaRegla(x: number): number { return Math.round(x * 1000) / 1000; }

export function generarRigidez4(rnd: () => number = Math.random): number {
  return Math.round((20 + rnd() * 40) * 10) / 10; // N/m
}

export interface MuestraEstatica { m: number; x: number }
export interface MuestraResorte extends MuestraCrono { m: number; A: number }

export function evaluarF4(h: { kSemilla: number; estatica: MuestraEstatica[]; dinamica: MuestraResorte[]; kAlumno: number | null }): Veredicto {
  const masasEst = new Set(h.estatica.map((s) => s.m));
  if (masasEst.size < 2) return no('Método estático: registra la elongación de al menos 2 masas distintas (F = m·g frente a x).');
  const validas = h.dinamica.filter((s) => muestraCronoValida(s, periodoResorte(s.m, h.kSemilla)));
  if (h.dinamica.length > validas.length) {
    return no(`Hay muestras de periodo incoherentes. Cronometra al menos ${OSCILACIONES_MIN} oscilaciones completas por muestra.`);
  }
  if (new Set(validas.map((s) => s.m)).size < 3) return no('Método dinámico: mide el periodo con al menos 3 masas distintas.');
  if (new Set(validas.map((s) => s.A)).size < 2) return no('Comprueba que el periodo no depende de la amplitud: repite una medición con otra amplitud.');
  if (!finito(h.kAlumno)) return no('Calcula k con tus datos y escríbela.');
  if (relErr(h.kAlumno, h.kSemilla) > TOL_RESULTADO_CRONO) return no('Tu k no coincide con tus mediciones (tolerancia ±5 %). Usa k = m·g/x o k = 4π²m/T² con varias muestras.');
  return OK;
}

// ═════════════════════════════════════════════════════════════════════════════
// F5 — Prensa hidráulica (Pascal)
// ═════════════════════════════════════════════════════════════════════════════
export const RANGO_R1 = { min: 0.5, max: 1.5, paso: 0.1 }; // cm
export const RANGO_R2 = { min: 2.0, max: 4.0, paso: 0.1 }; // cm
export const RANGO_F1 = { min: 0, max: 2000, paso: 1 };    // N
export const CARRERA_ENTRADA_CM = 10; // recorrido del émbolo pequeño en un bombeo
export const TOL_FUERZA_MIN = 0.03;

export const areaCm = (r_cm: number) => Math.PI * (r_cm / 100) ** 2; // m²

/** Fuerza mínima en el émbolo pequeño para sostener la carga: P igual en ambos (Pascal). */
export function fuerzaMinima(masaCarga: number, r1: number, r2: number): number {
  return masaCarga * G_TIERRA * (r1 / r2) ** 2;
}
/** Conservación del volumen del fluido incompresible: A1·d1 = A2·d2. */
export function desplazamientoSalida(d1: number, r1: number, r2: number): number {
  return d1 * (r1 / r2) ** 2;
}

export function generarCarga5(rnd: () => number = Math.random): number {
  return Math.round((250 + rnd() * 1550) / 10) * 10; // kg
}

export interface Ensayo5 { r1: number; r2: number; f1: number; prediccion: number; masaCarga: number }
export function evaluarF5(p: { ensayo: Ensayo5 | null }): Veredicto {
  const e = p.ensayo;
  if (!e) return no('Escribe la fuerza mínima que predices y aplica F₁ con el pistón para hacer un ensayo.');
  const fmin = fuerzaMinima(e.masaCarga, e.r1, e.r2);
  if (e.f1 < fmin) return no('En tu último ensayo la carga no subió: la presión no alcanzó para sostener su peso.');
  if (!finito(e.prediccion) || relErr(e.prediccion, fmin) > TOL_FUERZA_MIN) {
    return no('La carga subió, pero tu predicción de la fuerza mínima no es correcta (tolerancia ±3 %). Iguala las presiones: F₁/A₁ = m·g/A₂.');
  }
  return OK;
}

// ═════════════════════════════════════════════════════════════════════════════
// F6 — Arquímedes: densidad de un sólido con dinamómetro
// ═════════════════════════════════════════════════════════════════════════════
/** Densidades de los fluidos a 20 °C (kg/m³). Fuente: CRC Handbook of Chemistry and Physics. */
export const FLUIDOS: Record<string, { nombre: string; rho: number }> = {
  agua:      { nombre: 'Agua',      rho: 998 },
  alcohol:   { nombre: 'Etanol',    rho: 789 },
  glicerina: { nombre: 'Glicerina', rho: 1261 },
};
export const RESOLUCION_DINAMOMETRO = 0.01; // N
export const TOL_DENSIDAD = 0.03;

/**
 * Peso aparente que marca el dinamómetro con una fracción f ∈ [0, 1] del volumen
 * sumergida: W − ρ_f·g·(f·V). La fracción se acota a [0, 1]: un sólido no puede
 * desalojar más volumen que el suyo. Los sólidos del reto son más densos que
 * cualquier fluido de la tabla, así que se hunden y el hilo siempre está tenso.
 */
export function pesoAparente(rhoC: number, V: number, rhoF: number, fraccion: number): number {
  const f = Math.min(1, Math.max(0, fraccion));
  return rhoC * V * G_TIERRA - rhoF * G_TIERRA * V * f;
}
export function lecturaDinamometro(N: number): number {
  return Math.round(N / RESOLUCION_DINAMOMETRO) * RESOLUCION_DINAMOMETRO;
}
export function generarSolido6(rnd: () => number = Math.random) {
  const densidadCuerpo = Math.round(1500 + rnd() * 7500); // kg/m³, de plásticos densos a metales
  const volumenCuerpo = (Math.round(150 + rnd() * 250) / 1e6); // m³ (150–400 cm³)
  return { densidadCuerpo, volumenCuerpo };
}

export function evaluarF6(a: { densidadCuerpo: number; lecturaAire: number | null; lecturaFluido: number | null; densidadAlumno: number | null }): Veredicto {
  if (a.lecturaAire === null) return no('Registra el peso del sólido en el aire (sin sumergir).');
  if (a.lecturaFluido === null) return no('Registra el peso aparente con el sólido COMPLETAMENTE sumergido.');
  if (!finito(a.densidadAlumno)) return no('Calcula la densidad del sólido con tus dos lecturas y escríbela.');
  if (relErr(a.densidadAlumno, a.densidadCuerpo) > TOL_DENSIDAD) {
    return no('Tu densidad no coincide con tus lecturas (tolerancia ±3 %). Recuerda: E = W − W_ap = ρ_f·g·V y ρ = W/(g·V).');
  }
  return OK;
}

// ═════════════════════════════════════════════════════════════════════════════
// F7 — Dilatación lineal
// ═════════════════════════════════════════════════════════════════════════════
/** α lineal a 20–25 °C (1/°C). Fuente: CRC Handbook (Al 23.1, Cu 16.5, acero al carbono ≈ 12). */
export const MATERIALES_DILATACION: Record<string, { nombre: string; alpha: number }> = {
  aluminio: { nombre: 'Aluminio', alpha: 23.1e-6 },
  cobre:    { nombre: 'Cobre',    alpha: 16.5e-6 },
  acero:    { nombre: 'Acero',    alpha: 12e-6 },
};
export const T_AMBIENTE = 20;   // °C
export const T_VAPOR = 100;     // °C: el vapor a 1 atm no calienta por encima de 100 °C
export const L0_MM = 500;
export const DT_MIN_MEDICION = 20;
export const TOL_ALPHA = 0.05;

export function dilatacion(alpha: number, L0mm: number, dT: number): number { return alpha * L0mm * dT; }
/** Comparador de carátula con resolución de 1 μm (0,001 mm). */
export function lecturaComparador(dLmm: number): number { return Math.round(dLmm * 1000) / 1000; }
export function generarAlpha7(rnd: () => number = Math.random): number {
  return Math.round(80 + rnd() * 220) / 10 * 1e-6; // 8.0–30.0 ×10⁻⁶ /°C
}
export function alphaDe(material: string, alphaMisterioso: number): number {
  return material === 'misterioso' ? alphaMisterioso : MATERIALES_DILATACION[material]?.alpha ?? NaN;
}

export interface Ensayo7 { material: string; dT: number; dL: number }
export function evaluarF7(d: { alphaMisterioso: number; ensayo: Ensayo7 | null; alphaAlumno: number | null }): Veredicto {
  const e = d.ensayo;
  if (!e || e.material !== 'misterioso') return no('Registra una medición de ΔL con el «Metal ?» montado en el banco.');
  if (e.dT < DT_MIN_MEDICION) return no(`Calienta al menos ${DT_MIN_MEDICION} °C antes de registrar: con ΔT pequeño el error de lectura domina.`);
  if (!finito(d.alphaAlumno)) return no('Calcula α con tu medición y escríbelo (en unidades de 10⁻⁶ /°C).');
  if (relErr(d.alphaAlumno * 1e-6, d.alphaMisterioso) > TOL_ALPHA) return no('Tu α no coincide con tu medición (tolerancia ±5 %). α = ΔL / (L₀·ΔT), con L₀ y ΔL en las MISMAS unidades.');
  return OK;
}

// ═════════════════════════════════════════════════════════════════════════════
// F8 — Ley de Ohm: resistencia limitadora de un LED
// ═════════════════════════════════════════════════════════════════════════════
/**
 * LED rojo de 5 mm: caída directa Vf ≈ 2,0 V (típico 1,8–2,2 V), corriente
 * nominal 20 mA y máxima absoluta 30 mA (hojas de datos típicas, p. ej. Kingbright
 * L-53HD). Por encima de ~35 mA se considera destruido.
 * La fuente tiene una resistencia interna de 0,5 Ω: sin resistencia limitadora,
 * la corriente solo la frena esa resistencia y el LED se quema.
 */
export const LED = { vf: 2.0, iNominal: 0.020, iMax: 0.030, iDestruccion: 0.035 };
export const R_INTERNA_FUENTE = 0.5;
export const RANGO_V8 = { min: 3, max: 12, paso: 0.5 };
export const RANGO_R8 = { min: 10, max: 1000, paso: 5 };
export const TOL_R8 = 0.05;

/** Corriente en el lazo fuente–(R)–LED. `R = null` ⇒ sin resistencia limitadora. */
export function corrienteLed(V: number, R: number | null): number {
  if (V <= LED.vf) return 0;
  return (V - LED.vf) / ((R ?? 0) + R_INTERNA_FUENTE);
}
export function resistenciaObjetivo(V: number): number { return (V - LED.vf) / LED.iNominal; }

export interface Ensayo8 { voltaje: number; resistencia: number; rCalculada: number | null; corriente: number; ledRoto: boolean }
export function evaluarF8(o: { ensayo: Ensayo8 | null }): Veredicto {
  const e = o.ensayo;
  if (!e) return no('Arma el circuito con resistencia (Módulo 02), escribe tu R calculada y cierra el circuito.');
  if (e.ledRoto) return no('El LED se quemó en tu último ensayo: la corriente superó su máximo. Recalcula la resistencia.');
  const rObj = resistenciaObjetivo(e.voltaje);
  if (!finito(e.rCalculada) || relErr(e.rCalculada, rObj) > TOL_R8) return no('Tu R calculada no da 20 mA con este voltaje (tolerancia ±5 %). Recuerda que el LED consume su propia caída de tensión.');
  if (relErr(e.resistencia, rObj) > TOL_R8) return no('La resistencia montada no es la que calculaste: ajusta la caja de resistencias a tu valor y repite el ensayo.');
  return OK;
}

// ═════════════════════════════════════════════════════════════════════════════
// F9 — Ley de Coulomb
// ═════════════════════════════════════════════════════════════════════════════
/** k = 1/(4πε₀) = 8.9875×10⁹ N·m²/C² (CODATA 2018). */
export const K_COULOMB = 8.9875517923e9;
export const TOL_FUERZA_COULOMB = 0.03;
export const CARGAS_UC = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
export const RANGO_R9_CM = { min: 2, max: 40, paso: 1 };

/** |F| en newtons con cargas en μC y distancia en cm (se convierten a C y m). */
export function fuerzaCoulomb(q1_uC: number, q2_uC: number, r_cm: number): number {
  const r = r_cm / 100;
  return (K_COULOMB * Math.abs(q1_uC * 1e-6 * q2_uC * 1e-6)) / (r * r);
}
export function tipoInteraccion(q1: number, q2: number): 'atraccion' | 'repulsion' {
  return q1 * q2 < 0 ? 'atraccion' : 'repulsion';
}
export interface Reto9 { q1: number; q2: number; r: number }
export function generarReto9(rnd: () => number = Math.random): Reto9 {
  const q = () => CARGAS_UC[Math.floor(rnd() * CARGAS_UC.length)];
  const r = RANGO_R9_CM.min + Math.floor(rnd() * (RANGO_R9_CM.max - RANGO_R9_CM.min + 1));
  return { q1: q(), q2: q(), r };
}
export function evaluarF9(e: { reto: Reto9; respuesta: number | null; tipoRespuesta: 'atraccion' | 'repulsion' | null }): Veredicto {
  if (!finito(e.respuesta)) return no('Calcula la magnitud de la fuerza para la configuración del reto y escríbela en newtons.');
  if (!e.tipoRespuesta) return no('Indica si la interacción del reto es de atracción o de repulsión.');
  if (e.tipoRespuesta !== tipoInteraccion(e.reto.q1, e.reto.q2)) return no('El tipo de interacción no es correcto: revisa los signos de las cargas.');
  if (relErr(e.respuesta, fuerzaCoulomb(e.reto.q1, e.reto.q2, e.reto.r)) > TOL_FUERZA_COULOMB) {
    return no('La magnitud no es correcta (tolerancia ±3 %). Convierte μC a C y cm a m antes de usar k = 8.99×10⁹ N·m²/C².');
  }
  return OK;
}

// ═════════════════════════════════════════════════════════════════════════════
// F10 — Motor de corriente directa de imán permanente
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Modelo estacionario del motor de CD: con flujo por espira Φ = B·A y N espiras,
 * la constante del motor es k = N·B·A (V·s/rad = N·m/A). En régimen permanente
 * el par motor iguala al de la carga: I = τ/k, y la fuerza contraelectromotriz
 * cierra el balance de tensiones: V = k·ω + I·Rₐ  ⇒  ω = (V − I·Rₐ)/k.
 * Por eso, a igual voltaje, MÁS espiras dan MÁS par por amperio pero MENOS
 * velocidad. Rₐ crece con N (más alambre). Invertir el campo invierte el giro;
 * con dos polos iguales enfrentados no hay flujo neto que atraviese la bobina.
 */
export const MOTOR = { B: 0.5, A: 20e-4, rEspira: 0.02 }; // T, m² (bobina 4 cm × 5 cm), Ω/espira
export const ESPIRAS10 = [10, 50, 100];
export const RANGO_V10 = { min: 0, max: 24, paso: 0.1 };
export const TOL_RPM = 0.05;
export const TOL_V10 = 0.05;

export type Polo = 'N' | 'S';
export function signoCampo(izq: Polo, der: Polo): number {
  if (izq === der) return 0;
  return izq === 'N' ? 1 : -1;
}
export const kMotor = (N: number) => N * MOTOR.B * MOTOR.A;
export const rArmadura = (N: number) => N * MOTOR.rEspira;

export interface ParamsMotor { voltaje: number; espiras: number; imanIzq: Polo; imanDer: Polo; carga: number }
export interface EstadoMotor { corriente: number; omega: number; rpm: number; arranca: boolean; sinCampo: boolean }

/** rpm con signo: + horario (visto desde el conmutador), − antihorario. */
export function estadoMotor(p: ParamsMotor): EstadoMotor {
  const s = signoCampo(p.imanIzq, p.imanDer);
  const Ra = rArmadura(p.espiras);
  if (s === 0) return { corriente: p.voltaje / Ra, omega: 0, rpm: 0, arranca: false, sinCampo: true };
  const k = kMotor(p.espiras);
  const I = p.carga / k;
  const fem = p.voltaje - I * Ra;
  if (fem <= 0) return { corriente: p.voltaje / Ra, omega: 0, rpm: 0, arranca: false, sinCampo: false };
  const omega = (s * fem) / k;
  return { corriente: I, omega, rpm: (omega * 60) / (2 * Math.PI), arranca: true, sinCampo: false };
}
export function voltajeNecesario(rpm: number, N: number, carga: number): number {
  const k = kMotor(N);
  return k * (Math.abs(rpm) * 2 * Math.PI) / 60 + rArmadura(N) * carga / k;
}
export interface Reto10 { rpmObjetivo: number; sentido: 'horario' | 'antihorario'; carga: number }
export function generarReto10(rnd: () => number = Math.random): Reto10 {
  return {
    rpmObjetivo: 600 + Math.floor(rnd() * 37) * 50,             // 600–2400 rpm
    sentido: rnd() < 0.5 ? 'horario' : 'antihorario',
    carga: Math.round((0.005 + rnd() * 0.015) * 1000) / 1000,   // 0.005–0.020 N·m
  };
}
export interface Ensayo10 extends ParamsMotor { vPrediccion: number | null }
export function evaluarF10(m: { reto: Reto10; ensayo: Ensayo10 | null }): Veredicto {
  const e = m.ensayo;
  if (!e) return no('Escribe el voltaje que predices, energiza el motor y mide su velocidad.');
  const est = estadoMotor(e);
  if (est.sinCampo) return no('Con dos polos iguales enfrentados no hay campo neto: el rotor no gira.');
  if (!est.arranca) return no('El motor no arrancó: el voltaje no alcanzó para vencer el par de la carga.');
  const sentido = est.rpm > 0 ? 'horario' : 'antihorario';
  if (sentido !== m.reto.sentido) return no('El motor gira en el sentido contrario al pedido. ¿Qué cambia si inviertes los imanes?');
  if (relErr(Math.abs(est.rpm), m.reto.rpmObjetivo) > TOL_RPM) return no('La velocidad medida no está dentro de ±5 % del objetivo.');
  const vNec = voltajeNecesario(m.reto.rpmObjetivo, e.espiras, e.carga);
  if (!finito(e.vPrediccion) || relErr(e.vPrediccion, vNec) > TOL_V10) {
    return no('El motor llegó al objetivo, pero tu voltaje predicho no corresponde al modelo (tolerancia ±5 %). Usa V = k·ω + I·Rₐ con k = N·B·A e I = τ/k.');
  }
  return OK;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validadores booleanos (los usa fisicaSlice: validarF1…validarF10)
// ─────────────────────────────────────────────────────────────────────────────
export const validarF1 = (s: Parameters<typeof evaluarF1>[0]) => evaluarF1(s).ok;
export const validarF2 = (s: Parameters<typeof evaluarF2>[0]) => evaluarF2(s).ok;
export const validarF3 = (s: Parameters<typeof evaluarF3>[0]) => evaluarF3(s).ok;
export const validarF4 = (s: Parameters<typeof evaluarF4>[0]) => evaluarF4(s).ok;
export const validarF5 = (s: Parameters<typeof evaluarF5>[0]) => evaluarF5(s).ok;
export const validarF6 = (s: Parameters<typeof evaluarF6>[0]) => evaluarF6(s).ok;
export const validarF7 = (s: Parameters<typeof evaluarF7>[0]) => evaluarF7(s).ok;
export const validarF8 = (s: Parameters<typeof evaluarF8>[0]) => evaluarF8(s).ok;
export const validarF9 = (s: Parameters<typeof evaluarF9>[0]) => evaluarF9(s).ok;
export const validarF10 = (s: Parameters<typeof evaluarF10>[0]) => evaluarF10(s).ok;

// ─────────────────────────────────────────────────────────────────────────────
// Formas del estado de cada lab (las importa src/store/types.ts)
// ─────────────────────────────────────────────────────────────────────────────
type Res = 'exito' | 'error' | null;

export interface EstadoTiro1 extends Mision1 {
  angulo: number; velocidad: number;
  disparando: boolean;
  /** Resultado del ÚLTIMO disparo (feedback), no el veredicto del lab. */
  resultado: 'exito' | 'fallo' | 'colision' | null;
  /** Impactos confirmados en este intento: el veredicto del lab. */
  aciertos: number;
  disparos: number;
  municion: number;
  distanciaReal: number;
  yImpacto: number;
  /** Disparo que se dibuja en la escena (parámetros con los que se lanzó). */
  ultimoDisparo: (Disparo1 & Mision1 & { id: number; tVuelo: number }) | null;
  densidadAire: number;
  estado: 'idle' | 'success';
}
export interface EstadoPlano2 {
  angulo: number; empuje: number; cargaExtra: number; masaBase: number; muS: number; muK: number;
  ensayo: (ParamsPlano & { prediccion: number }) | null;
  resultado: Res;
}
export interface EstadoPendulo3 {
  gSemilla: number; longitud: number; masa: number; oscilando: boolean;
  muestras: MuestraPendulo[]; gAlumno: number | null; resultado: Res;
}
export interface EstadoHooke4 {
  kSemilla: number; masa: number; amplitud: number; oscilando: boolean;
  estatica: MuestraEstatica[]; dinamica: MuestraResorte[]; kAlumno: number | null; resultado: Res;
}
export interface EstadoPrensa5 {
  masaCarga: number; r1: number; r2: number; f1: number; prediccion: number | null;
  ensayo: Ensayo5 | null; resultado: Res;
}
export interface EstadoArquimedes6 {
  densidadCuerpo: number; volumenCuerpo: number; fluido: string; densidadLiquido: number;
  sumergido: number; lecturaAire: number | null; lecturaFluido: number | null; fluidoLectura: string | null;
  densidadAlumno: number | null; resultado: Res;
}
export interface EstadoDilatacion7 {
  material: string; tempIni: number; longitud: number; alphaMisterioso: number;
  ensayo: Ensayo7 | null; alphaAlumno: number | null; resultado: Res;
}
export interface EstadoOhm8 {
  nivel: number; voltaje: number; resistencia: number; switchOn: boolean; ledRoto: boolean;
  bateriaConectada: boolean; resistenciaConectada: boolean; ledConectado: boolean;
  rCalculada: number | null; ensayo: Ensayo8 | null; resultado: Res;
}
export interface EstadoElectrostatica9 {
  q1: number; q2: number; distancia: number; reto: Reto9;
  respuesta: number | null; tipoRespuesta: 'atraccion' | 'repulsion' | null; resultado: Res;
}
export interface EstadoMotor10 extends ParamsMotor {
  encendido: boolean; reto: Reto10; vPrediccion: number | null; ensayo: Ensayo10 | null; resultado: Res;
}
