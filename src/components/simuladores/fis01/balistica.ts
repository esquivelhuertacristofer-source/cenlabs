/**
 * fis01/balistica.ts — la física del tiro parabólico (módulo puro, sin three ni React).
 *
 * El integrador es el del dominio (`volarTiro`, RK4 con cruces por Hermite): el MISMO que
 * decide el veredicto del reto. Aquí se añaden:
 *  · las formas cerradas del vacío (alcance, altura máxima, tiempo de vuelo, posición), con
 *    las que se comprueba el integrador y que el dock compara con lo medido;
 *  · la energía mecánica por unidad de masa y la potencia del arrastre (su pérdida);
 *  · el ángulo de máximo alcance (sección áurea sobre el vuelo integrado): 45° sin aire y
 *    menos de 45° con arrastre cuadrático;
 *  · la trayectoria con lectura densa (Hermite entre muestras: exacta sin aire) y las marcas
 *    del estroboscopio a intervalos iguales de tiempo.
 *
 * Unidades SI. Ángulos en grados en la interfaz, radianes dentro.
 */
import {
  ESCENARIOS, coefArrastre, volarTiro, H_TIRO,
  type CondicionesTiro, type Disparo1, type MuestraTiro, type Vuelo,
} from '@/domain/fisica';

export const GRAD = Math.PI / 180;
/** g y k = ρ·Cd·A/(2m) del aire de la Tierra al nivel del mar (balín de 1 kg, Ø 12 cm, Cd 0,47). */
export const G_TIERRA = ESCENARIOS.tierra.g;
export const K_AIRE = coefArrastre(ESCENARIOS.tierra.rho);

// ───────────────────────────── vacío: formas cerradas ─────────────────────────────

/** Alcance a la altura de salida: R = v₀²·sen 2θ / g. */
export function alcanceVacio(v: number, ang: number, g: number): number {
  return (v * v * Math.sin(2 * ang * GRAD)) / g;
}
/** Altura máxima: H = y₀ + (v₀·sen θ)² / (2g). */
export function alturaMaxVacio(v: number, ang: number, g: number, y0 = 0): number {
  const vy = v * Math.sin(ang * GRAD);
  return y0 + Math.max(0, vy) ** 2 / (2 * g);
}
/** Tiempo de vuelo hasta y = 0: T = [v₀ sen θ + √((v₀ sen θ)² + 2g·y₀)] / g (= 2v₀ sen θ / g si y₀ = 0). */
export function tiempoVueloVacio(v: number, ang: number, g: number, y0 = 0): number {
  const vy = v * Math.sin(ang * GRAD);
  return (vy + Math.sqrt(vy * vy + 2 * g * y0)) / g;
}
/** Alcance hasta y = 0 saliendo desde y₀. */
export function alcanceVacioDesde(v: number, ang: number, g: number, y0: number): number {
  return v * Math.cos(ang * GRAD) * tiempoVueloVacio(v, ang, g, y0);
}
/** Estado del vacío en t: x = v₀cosθ·t, y = y₀ + v₀senθ·t − ½gt². */
export function estadoVacio(v: number, ang: number, g: number, y0: number, t: number) {
  const vx = v * Math.cos(ang * GRAD), vy0 = v * Math.sin(ang * GRAD);
  return { x: vx * t, y: y0 + vy0 * t - 0.5 * g * t * t, vx, vy: vy0 - g * t };
}

// ───────────────────────────── energía ─────────────────────────────

/** Energía mecánica por unidad de masa (J/kg): ½v² + g·y. Se conserva sin aire. */
export function energia(m: { y: number; vx: number; vy: number }, g: number): number {
  return 0.5 * (m.vx * m.vx + m.vy * m.vy) + g * m.y;
}
/** dE/dt por unidad de masa (W/kg) = a_arrastre · v = −k·|v − w|·(v − w)·v (≤ 0 sin viento). */
export function potenciaArrastre(k: number, viento: number, vx: number, vy: number): number {
  const rx = vx - viento, rv = Math.hypot(rx, vy);
  return -k * rv * (rx * vx + vy * vy);
}
/** Velocidad terminal de caída: v_t = √(g/k). */
export const velocidadTerminal = (g: number, k: number) => Math.sqrt(g / k);

// ───────────────────────────── trayectoria ─────────────────────────────

export interface Trayectoria {
  cond: CondicionesTiro;
  d: Disparo1;
  vuelo: Vuelo;
  /** tiempo de vuelo (s) */
  T: number;
  muestras: MuestraTiro[];
}

export function trayectoria(cond: CondicionesTiro, d: Disparo1): Trayectoria {
  const vuelo = volarTiro(cond, d, true);
  return { cond, d, vuelo, T: vuelo.t, muestras: vuelo.muestras };
}

export interface EstadoTiro { t: number; x: number; y: number; vx: number; vy: number }

/** Estado en t (0 ≤ t ≤ T) por Hermite entre las muestras del integrador: exacto sin aire. */
export function estadoEn(tr: Trayectoria, t: number, out?: EstadoTiro): EstadoTiro {
  const m = tr.muestras;
  const r = out ?? { t: 0, x: 0, y: 0, vx: 0, vy: 0 };
  const n = m.length;
  if (n === 0) { r.t = 0; r.x = 0; r.y = tr.cond.y0; r.vx = 0; r.vy = 0; return r; }
  const tc = Math.min(Math.max(t, 0), m[n - 1].t);
  // las muestras van cada H_TIRO salvo la última (el cruce): índice directo y corrección
  let i = Math.min(n - 2, Math.max(0, Math.floor(tc / H_TIRO)));
  while (i > 0 && m[i].t > tc) i--;
  while (i < n - 2 && m[i + 1].t < tc) i++;
  if (n === 1) { const a = m[0]; r.t = a.t; r.x = a.x; r.y = a.y; r.vx = a.vx; r.vy = a.vy; return r; }
  const a = m[i], b = m[i + 1];
  const h = b.t - a.t;
  if (!(h > 0)) { r.t = a.t; r.x = a.x; r.y = a.y; r.vx = a.vx; r.vy = a.vy; return r; }
  const s = (tc - a.t) / h, s2 = s * s, s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  const d00 = (6 * s2 - 6 * s) / h, d10 = 3 * s2 - 4 * s + 1, d01 = (-6 * s2 + 6 * s) / h, d11 = 3 * s2 - 2 * s;
  r.t = tc;
  r.x = h00 * a.x + h10 * h * a.vx + h01 * b.x + h11 * h * b.vx;
  r.y = h00 * a.y + h10 * h * a.vy + h01 * b.y + h11 * h * b.vy;
  r.vx = d00 * a.x + d10 * a.vx + d01 * b.x + d11 * b.vx;
  r.vy = d00 * a.y + d10 * a.vy + d01 * b.y + d11 * b.vy;
  return r;
}

/** Instante del vértice (vy = 0) por bisección sobre la lectura densa; null si no sube. */
export function tiempoApice(tr: Trayectoria): number | null {
  const m = tr.muestras;
  if (m.length < 2 || m[0].vy <= 0) return null;
  let a = 0, b = tr.T;
  const e: EstadoTiro = { t: 0, x: 0, y: 0, vx: 0, vy: 0 };
  if (estadoEn(tr, b, e).vy > 0) return null;
  for (let i = 0; i < 60; i++) {
    const c = (a + b) / 2;
    if (estadoEn(tr, c, e).vy > 0) a = c; else b = c;
  }
  return (a + b) / 2;
}

// ───────────────────────────── ángulo de máximo alcance ─────────────────────────────

/** Alcance integrado (sin muro, hasta y = 0) para un ángulo. */
export function alcance(v: number, ang: number, g: number, k: number, y0 = 0, viento = 0): number {
  return volarTiro({ g, k, viento, y0, muro: null }, { angulo: ang, velocidad: v }).hitX;
}

/**
 * Ángulo que maximiza el alcance (sección áurea en [1°, 89°], tolerancia 10⁻⁴°). Sin aire y
 * con y₀ = 0 da 45°; con arrastre cuadrático baja (tanto más cuanto más rápido el disparo).
 */
export function anguloOptimo(v: number, g: number, k: number, y0 = 0, viento = 0): { angulo: number; alcance: number } {
  const f = (a: number) => alcance(v, a, g, k, y0, viento);
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = 1, b = 89;
  let c = b - phi * (b - a), d = a + phi * (b - a);
  let fc = f(c), fd = f(d);
  while (b - a > 1e-4) {
    if (fc > fd) { b = d; d = c; fd = fc; c = b - phi * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + phi * (b - a); fd = f(d); }
  }
  const ang = (a + b) / 2;
  return { angulo: ang, alcance: f(ang) };
}

// ───────────────────────────── estroboscopio ─────────────────────────────

const PASOS_ESTROBO = [0.05, 0.1, 0.2, 0.5, 1, 2, 5] as const;
/** Intervalo «redondo» del estroboscopio: el menor que deja ≤ 24 imágenes en el vuelo. */
export function pasoEstrobo(T: number): number {
  for (const p of PASOS_ESTROBO) if (T / p <= 24) return p;
  return PASOS_ESTROBO[PASOS_ESTROBO.length - 1];
}

/** Imágenes del estroboscopio: el estado en t = k·Δt para k = 0, 1, … mientras t ≤ T. */
export function marcasEstrobo(tr: Trayectoria, dt: number): EstadoTiro[] {
  const r: EstadoTiro[] = [];
  const n = Math.floor(tr.T / dt + 1e-9);
  for (let k = 0; k <= n; k++) r.push(estadoEn(tr, k * dt));
  return r;
}

// ───────────────────────────── condiciones del banco ─────────────────────────────

/** El banco de exploración: Tierra, sin viento, salida a ras de la pista (y₀ = 0), sin muro. */
export function condicionesBanco(aire: boolean): CondicionesTiro {
  return { g: G_TIERRA, k: aire ? K_AIRE : 0, viento: 0, y0: 0, muro: null };
}
