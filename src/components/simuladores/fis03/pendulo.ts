/**
 * fis03/pendulo.ts — la física del péndulo simple (módulo puro: sin three ni React).
 *
 *  · Ecuación COMPLETA: θ″ = −(g/L)·sen θ − 2γ·θ′, integrada con RK4 de subpaso ≤ 1 ms.
 *    Nada de sen θ ≈ θ en el péndulo «real»: la escena, el dock y la fotopuerta leen esto.
 *  · Periodo exacto sin amortiguar: T = 4·√(L/g)·K(k), k = sen(θ₀/2), con la integral
 *    elíptica completa de primera especie por la media aritmético-geométrica:
 *        K(k) = π / (2·AGM(1, √(1 − k²)))        (Abramowitz & Stegun 17.6)
 *  · Serie de ángulo pequeño: T ≈ T₀·(1 + θ₀²/16 + 11·θ₀⁴/3072), T₀ = 2π·√(L/g).
 *  · Péndulo «lineal» (sen θ ≈ θ), el fantasma de la escena: la solución EXACTA de
 *    θ″ = −ω₀²·θ − 2γ·θ′ con θ(0) = θ₀, θ′(0) = 0. Su amplitud decae como e^(−γt).
 *  · Fotopuerta: el periodo es el tiempo entre dos pasos por θ = 0 en el mismo sentido,
 *    con el instante de cada paso interpolado dentro del subpaso (como un cronómetro de
 *    0,1 ms que dispara con el borde del haz).
 *
 * Unidades SI: L en m, g en m/s², t en s, θ en rad, ω en rad/s, γ en s⁻¹.
 */

export const GRAD = Math.PI / 180;

/** Densidad del latón CuZn37 (kg/m³); el latón comercial va de 8400 a 8700. */
export const RHO_LATON = 8500;

/** Subpaso máximo de integración (s). Con ω₀ ≤ 7 rad/s, ω₀·h ≤ 0,007: error de RK4 ~1e-10. */
export const H_MAX = 1e-3;

/** Amortiguamiento del mando «Amortiguado» (s⁻¹): la amplitud cae a la mitad en ln 2/γ ≈ 20 s. */
export const GAMMA_AMORTIGUADO = 0.035;

/** Amplitud máxima del lab: por encima de 90° un hilo (no una varilla) se destensa al soltarlo. */
export const THETA_MAX = 90 * GRAD;

export interface ParamsPendulo {
  /** longitud del pivote al centro de masa (m) */
  L: number;
  /** gravedad (m/s²) */
  g: number;
  /** amortiguamiento viscoso (s⁻¹) */
  gamma: number;
}

export interface EstadoPendulo { t: number; theta: number; omega: number }

/** Pulsación de ángulo pequeño ω₀ = √(g/L) (rad/s). */
export const omega0 = (p: { L: number; g: number }) => Math.sqrt(p.g / p.L);

/** T₀ = 2π·√(L/g): el periodo de ángulo pequeño (s). */
export function periodoPequeno(L: number, g: number): number {
  return 2 * Math.PI * Math.sqrt(L / g);
}

/** Media aritmético-geométrica: converge cuadráticamente (≈ 5 iteraciones a 1e-16). */
export function agm(a: number, b: number): number {
  for (let i = 0; i < 64; i++) {
    const an = (a + b) / 2, bn = Math.sqrt(a * b);
    a = an; b = bn;
    if (Math.abs(a - b) <= 2e-16 * a) break;
  }
  return (a + b) / 2;
}

/** Integral elíptica completa de primera especie K(k) = ∫₀^{π/2} dφ/√(1 − k²·sen²φ). */
export function elipticaK(k: number): number {
  const kk = Math.abs(k);
  if (kk >= 1) return Infinity;
  return Math.PI / (2 * agm(1, Math.sqrt(1 - kk * kk)));
}

/** T/T₀ exacto para la amplitud θ₀ (rad): 2·K(sen(θ₀/2))/π. */
export function razonPeriodo(theta0: number): number {
  return (2 / Math.PI) * elipticaK(Math.sin(Math.abs(theta0) / 2));
}

/** Periodo exacto T = 4·√(L/g)·K(sen(θ₀/2)) (s), sin amortiguamiento. */
export function periodoExacto(L: number, g: number, theta0: number): number {
  return 4 * Math.sqrt(L / g) * elipticaK(Math.sin(Math.abs(theta0) / 2));
}

/** T/T₀ por la serie de dos términos 1 + θ₀²/16 + 11·θ₀⁴/3072. */
export function razonSerie(theta0: number): number {
  const x2 = theta0 * theta0;
  return 1 + x2 / 16 + (11 * x2 * x2) / 3072;
}

/** T por la serie (s). */
export function periodoSerie(L: number, g: number, theta0: number): number {
  return periodoPequeno(L, g) * razonSerie(theta0);
}

/** θ″ de la ecuación completa (rad/s²). */
export function aceleracion(theta: number, omega: number, p: ParamsPendulo): number {
  return -(p.g / p.L) * Math.sin(theta) - 2 * p.gamma * omega;
}

/** Un paso de Runge–Kutta clásico de orden 4 (modifica `e`). */
export function pasoRK4(e: EstadoPendulo, p: ParamsPendulo, h: number): void {
  const th = e.theta, w = e.omega;
  const k1t = w, k1w = aceleracion(th, w, p);
  const k2t = w + 0.5 * h * k1w, k2w = aceleracion(th + 0.5 * h * k1t, w + 0.5 * h * k1w, p);
  const k3t = w + 0.5 * h * k2w, k3w = aceleracion(th + 0.5 * h * k2t, w + 0.5 * h * k2w, p);
  const k4t = w + h * k3w, k4w = aceleracion(th + h * k3t, w + h * k3w, p);
  e.theta = th + (h / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
  e.omega = w + (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
  e.t += h;
}

/** Avanza `dt` segundos con subpasos iguales de ≤ H_MAX. */
export function avanzar(e: EstadoPendulo, p: ParamsPendulo, dt: number): void {
  if (!(dt > 0)) return;
  const n = Math.max(1, Math.ceil(dt / H_MAX));
  const h = dt / n;
  for (let i = 0; i < n; i++) pasoRK4(e, p, h);
}

/** Energía mecánica por unidad de masa (J/kg): ½·L²·ω² + g·L·(1 − cos θ). */
export function energiaEspecifica(theta: number, omega: number, p: { L: number; g: number }): number {
  return 0.5 * p.L * p.L * omega * omega + p.g * p.L * (1 - Math.cos(theta));
}

/** Cinética y potencial por unidad de masa (J/kg). */
export function energias(theta: number, omega: number, p: { L: number; g: number }): { K: number; U: number } {
  return { K: 0.5 * p.L * p.L * omega * omega, U: p.g * p.L * (1 - Math.cos(theta)) };
}

/** Rapidez angular en el punto más bajo sin amortiguar: 2·ω₀·sen(θ₀/2) (conservación de la energía). */
export function omegaMaxima(theta0: number, p: { L: number; g: number }): number {
  return 2 * omega0(p) * Math.sin(Math.abs(theta0) / 2);
}

/**
 * El péndulo LINEAL (sen θ ≈ θ) soltado desde θ₀ en reposo en t = 0: solución exacta de
 * θ″ = −ω₀²·θ − 2γ·θ′. Subamortiguado: θ = θ₀·e^(−γt)·[cos ω_d t + (γ/ω_d)·sen ω_d t].
 */
export function lineal(t: number, theta0: number, p: ParamsPendulo): { theta: number; omega: number } {
  const w0 = omega0(p), g = p.gamma;
  if (g < w0) {
    const wd = Math.sqrt(w0 * w0 - g * g);
    const env = Math.exp(-g * t);
    const c = Math.cos(wd * t), s = Math.sin(wd * t);
    return { theta: theta0 * env * (c + (g / wd) * s), omega: -theta0 * env * ((w0 * w0) / wd) * s };
  }
  if (g === w0) {
    const env = Math.exp(-w0 * t);
    return { theta: theta0 * env * (1 + w0 * t), omega: -theta0 * env * w0 * w0 * t };
  }
  // sobreamortiguado (fuera del rango del lab, pero exacto)
  const q = Math.sqrt(g * g - w0 * w0);
  const r1 = -g + q, r2 = -g - q;
  const a = (theta0 * r2) / (r2 - r1), b = theta0 - a;
  return { theta: a * Math.exp(r1 * t) + b * Math.exp(r2 * t), omega: a * r1 * Math.exp(r1 * t) + b * r2 * Math.exp(r2 * t) };
}

/** Radio (m) de una esfera maciza de masa m (kg) y densidad ρ. */
export function radioEsfera(m: number, rho = RHO_LATON): number {
  return Math.cbrt((3 * m) / (4 * Math.PI * rho));
}

/** Tensión del hilo (N): T = m·(g·cos θ + L·ω²). Se anula al soltar a 90°. */
export function tensionHilo(theta: number, omega: number, p: { L: number; g: number }, m: number): number {
  return m * (p.g * Math.cos(theta) + p.L * omega * omega);
}

// ───────────────────────────── fotopuerta ─────────────────────────────

/**
 * Detector de pasos por θ = 0. `registrar` recibe cada subpaso (antes → después) y, si el
 * signo de θ cambió, guarda el instante del paso interpolado linealmente (en θ = 0 la
 * curvatura de θ(t) es −2γω, casi nula: el error es ~γh²/4 ≈ 1e-8 s).
 * El periodo es la diferencia entre un paso y el antepenúltimo (mismo sentido).
 */
export class DetectorPasos {
  /** instantes de los tres últimos pasos (el último en [2]) */
  readonly t: [number, number, number] = [NaN, NaN, NaN];
  pasos = 0;
  periodo = NaN;

  reiniciar() { this.t[0] = this.t[1] = this.t[2] = NaN; this.pasos = 0; this.periodo = NaN; }

  /** Devuelve true si en este subpaso se completó un periodo. */
  registrar(t0: number, th0: number, t1: number, th1: number): boolean {
    if (!((th0 > 0 && th1 <= 0) || (th0 < 0 && th1 >= 0))) return false;
    if (th0 === th1) return false;
    const tc = t0 + ((t1 - t0) * th0) / (th0 - th1);
    this.t[0] = this.t[1]; this.t[1] = this.t[2]; this.t[2] = tc;
    this.pasos++;
    if (this.pasos >= 3) { this.periodo = this.t[2] - this.t[0]; return true; }
    return false;
  }

  /** Oscilaciones completas cronometradas desde el primer paso. */
  get oscilaciones(): number { return this.pasos >= 1 ? Math.floor((this.pasos - 1) / 2) : 0; }
}

/**
 * Periodo medido como lo mide la fotopuerta: suelta desde θ₀ en reposo, integra con RK4 y
 * devuelve el tiempo entre el primer y el tercer paso por θ = 0.
 */
export function periodoSimulado(theta0: number, p: ParamsPendulo, h = H_MAX): number {
  const e: EstadoPendulo = { t: 0, theta: theta0, omega: 0 };
  const d = new DetectorPasos();
  const tMax = 20 * periodoExacto(p.L, p.g, Math.min(Math.abs(theta0), 179 * GRAD));
  while (e.t < tMax) {
    const t0 = e.t, th0 = e.theta;
    pasoRK4(e, p, h);
    if (d.registrar(t0, th0, e.t, e.theta)) return d.periodo;
  }
  return NaN;
}
