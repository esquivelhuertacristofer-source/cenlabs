/**
 * fis06/ondas.ts — la superficie del líquido (módulo puro: sin three ni React).
 *
 * Campo de alturas u(x, z) sobre la planta del tanque (celdas de dx), perturbación sobre el
 * nivel medio ys que fija la hidrostática. Ecuación de ondas lineal con amortiguamiento:
 *
 *     ∂²u/∂t² = c²·∇²u − γ·∂u/∂t
 *
 *  · c: velocidad de fase de las ondas de λ = 4 cm, con gravedad y tensión superficial,
 *    c² = g·λ/2π + 2π·σ/(ρ·λ) (agua 0,27 m/s). El agua real es dispersiva (cada λ va a su
 *    velocidad); aquí todas van a la de 4 cm: simplificación declarada.
 *  · γ = 2·ν·k² (disipación viscosa de Lamb para k = 2π/λ) + 1,5 s⁻¹ de pérdidas en las
 *    paredes y el menisco. En glicerina (ν ≈ 1100 veces la del agua) las ondas mueren al nacer.
 *  · Paredes del tanque y del cuerpo: reflexión (derivada normal nula).
 *  · FUENTE: el volumen que el cuerpo desaloja en cada paso (dV_sum) sube la banda de ~1 cm
 *    que rodea su línea de flotación: es la conservación del volumen. El nivel medio ya lo
 *    sube la hidrostática, así que al campo se le quita su media en cada paso.
 *  · Microagitación del aire y de la mesa: pulsos gaussianos de 0,05 mm, unos tres por segundo
 *    (declarado; es lo que mantiene vivos los reflejos de un agua «quieta»).
 */
import { G, TANQUE, type Liquido } from './flotacion';

/** Longitud de onda de referencia (m). */
export const LAMBDA_REF = 0.04;
/** Pérdidas en paredes y menisco (1/s). */
export const GAMMA_PAREDES = 1.5;
/** Anchura (m) de la banda de la que sale el agua que aparta el cuerpo. */
export const ANCHO_FUENTE = 0.012;
/** Amplitud (m) y frecuencia (1/s) de la microagitación. */
export const AMPLITUD_AMBIENTE = 5e-5;
export const TASA_AMBIENTE = 3;

export function velocidadFase(liq: Liquido, lambda = LAMBDA_REF): number {
  return Math.sqrt((G * lambda) / (2 * Math.PI) + (2 * Math.PI * liq.sigma) / (liq.rho * lambda));
}
export function amortiguamiento(liq: Liquido, lambda = LAMBDA_REF): number {
  const k = (2 * Math.PI) / lambda;
  return 2 * (liq.mu / liq.rho) * k * k + GAMMA_PAREDES;
}

/** Huella del cuerpo en la superficie: rectángulo [x1, x2] × [z1, z2] (m) o disco. */
export type Huella = { tipo: 'rect'; x1: number; x2: number; z1: number; z2: number } | { tipo: 'disco'; r: number } | null;

export class Ondas {
  readonly nx: number;
  readonly nz: number;
  readonly dx: number;
  readonly x0 = -TANQUE.largo / 2;
  readonly z0 = -TANQUE.ancho / 2;
  u: Float32Array;
  ant: Float32Array;
  private sig: Float32Array;
  /** 1 = superficie libre; 0 = la ocupa el cuerpo */
  libre: Uint8Array;
  /** peso de cada celda en la fuente (banda alrededor de la línea de flotación) */
  private peso: Float32Array;
  c = 0.27;
  gamma = 0.6;
  /** 0–1: intensidad de la microagitación */
  agitacion = 1;
  private sem = 12345;
  private relojAmbiente = 0;

  constructor(dx: number) {
    this.dx = dx;
    this.nx = Math.round(TANQUE.largo / dx);
    this.nz = Math.round(TANQUE.ancho / dx);
    const n = this.nx * this.nz;
    this.u = new Float32Array(n);
    this.ant = new Float32Array(n);
    this.sig = new Float32Array(n);
    this.libre = new Uint8Array(n).fill(1);
    this.peso = new Float32Array(n);
  }

  fijarLiquido(liq: Liquido) {
    this.c = velocidadFase(liq);
    this.gamma = amortiguamiento(liq);
  }

  calmar() { this.u.fill(0); this.ant.fill(0); }

  private azar() { this.sem = (this.sem * 16807) % 2147483647; return this.sem / 2147483647; }

  /**
   * Marca las celdas que ocupa el cuerpo y reparte el peso de la fuente: una banda de
   * ANCHO_FUENTE alrededor de la línea de flotación con peso e^(−d/ANCHO_FUENTE) (la masa
   * de agua que el cuerpo aparta no sale de una línea, sino de su entorno). Devuelve ∑pesos.
   */
  private marcar(h: Huella): number {
    const { nx, nz, dx, x0, z0, libre, u, ant, peso } = this;
    let suma = 0;
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * dx, z = z0 + (k + 0.5) * dx;
      let d = Infinity;
      if (h?.tipo === 'rect') {
        const ex = Math.max(h.x1 - x, 0, x - h.x2), ez = Math.max(h.z1 - z, 0, z - h.z2);
        d = ex === 0 && ez === 0 ? 0 : Math.hypot(ex, ez);
        if (d === 0) d = x >= h.x1 && x <= h.x2 && z >= h.z1 && z <= h.z2 ? 0 : d;
      } else if (h?.tipo === 'disco') d = Math.max(0, Math.hypot(x, z) - h.r);
      const dentro = h !== null && d === 0;
      const j = k * nx + i;
      const antes = libre[j];
      libre[j] = dentro ? 0 : 1;
      if (antes !== libre[j]) { u[j] = 0; ant[j] = 0; }
      const w = !dentro && d < 3 * ANCHO_FUENTE ? Math.exp(-d / ANCHO_FUENTE) : 0;
      peso[j] = w; suma += w;
    }
    return suma;
  }

  /** Avanza dt (s de modelo). `dV`: volumen sumergido ganado en este dt (m³). */
  paso(dt: number, huella: Huella, dV: number) {
    const sumaPesos = this.marcar(huella);
    const { nx, nz, dx, libre, peso } = this;
    // fuente: el volumen desalojado en este paso sube la banda que rodea la línea de flotación
    // (desplazamiento puro: se suma también al paso anterior para no inventar velocidad)
    if (sumaPesos > 0 && dV !== 0) {
      const dh = dV / (sumaPesos * dx * dx);
      for (let j = 0; j < peso.length; j++) if (peso[j] > 0) { const d = dh * peso[j]; this.u[j] += d; this.ant[j] += d; }
    }
    // microagitación (proceso de Poisson)
    if (this.agitacion > 0) {
      this.relojAmbiente -= dt * TASA_AMBIENTE;
      while (this.relojAmbiente <= 0) {
        this.relojAmbiente += -Math.log(Math.max(1e-9, this.azar()));
        this.pulso(this.x0 + this.azar() * TANQUE.largo, this.z0 + this.azar() * TANQUE.ancho, 0.015, AMPLITUD_AMBIENTE * this.agitacion * (this.azar() < 0.5 ? -1 : 1));
      }
    }
    const pasoMax = (0.6 * dx) / this.c;
    const n = Math.max(1, Math.ceil(dt / pasoMax));
    const h = dt / n;
    const r2 = (this.c * h / dx) ** 2;
    const amort = Math.max(0, 1 - this.gamma * h);
    for (let s = 0; s < n; s++) {
      const u = this.u, a = this.ant, sig = this.sig;
      for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
        const j = k * nx + i;
        if (!libre[j]) { sig[j] = 0; continue; }
        const c0 = u[j];
        const l = i > 0 && libre[j - 1] ? u[j - 1] : c0;
        const rr = i < nx - 1 && libre[j + 1] ? u[j + 1] : c0;
        const d = k > 0 && libre[j - nx] ? u[j - nx] : c0;
        const t = k < nz - 1 && libre[j + nx] ? u[j + nx] : c0;
        sig[j] = c0 + (c0 - a[j]) * amort + r2 * (l + rr + d + t - 4 * c0);
      }
      this.ant = u; this.u = sig; this.sig = a;
    }
    // el nivel medio lo lleva la hidrostática: el campo sólo guarda la perturbación
    let su = 0, sa = 0, nl = 0;
    for (let j = 0; j < libre.length; j++) if (libre[j]) { su += this.u[j]; sa += this.ant[j]; nl++; }
    if (nl > 0) {
      su /= nl; sa /= nl;
      for (let j = 0; j < libre.length; j++) if (libre[j]) { this.u[j] -= su; this.ant[j] -= sa; }
    }
  }

  /** Pulso gaussiano de altura `a` (m) y radio `r` (m), sin velocidad inicial. */
  pulso(x: number, z: number, r: number, a: number) {
    const { nx, nz, dx, x0, z0 } = this;
    const i0 = Math.max(0, Math.floor((x - 2 * r - x0) / dx)), i1 = Math.min(nx - 1, Math.ceil((x + 2 * r - x0) / dx));
    const k0 = Math.max(0, Math.floor((z - 2 * r - z0) / dx)), k1 = Math.min(nz - 1, Math.ceil((z + 2 * r - z0) / dx));
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) {
      const j = k * nx + i;
      if (!this.libre[j]) continue;
      const px = x0 + (i + 0.5) * dx - x, pz = z0 + (k + 0.5) * dx - z;
      const g = a * Math.exp(-(px * px + pz * pz) / (r * r));
      this.u[j] += g; this.ant[j] += g;
    }
  }

  /** Altura (m) en un vértice de la malla (i ∈ [0, nx], k ∈ [0, nz]): media de las celdas libres que lo tocan. */
  alturaVertice(i: number, k: number): number {
    const { nx, nz } = this;
    let s = 0, n = 0;
    for (let dk = -1; dk <= 0; dk++) for (let di = -1; di <= 0; di++) {
      const ii = i + di, kk = k + dk;
      if (ii < 0 || kk < 0 || ii >= nx || kk >= nz) continue;
      const j = kk * nx + ii;
      if (!this.libre[j]) continue;
      s += this.u[j]; n++;
    }
    return n ? s / n : 0;
  }

  /** Energía de la perturbación (∑u², m²·celda): para pruebas y diagnóstico. */
  energia(): number { let e = 0; for (let j = 0; j < this.u.length; j++) e += this.u[j] * this.u[j]; return e; }
}
