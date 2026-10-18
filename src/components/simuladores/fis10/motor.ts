/**
 * fis10/motor.ts — LA FÍSICA del motor de CD de imanes permanentes (módulo puro, sin three).
 *
 * Es la misma máquina que el dominio (`estadoMotor`: k = N·B·A, V = k·ω + I·Rₐ), vista por
 * dentro y cuadro a cuadro. De aquí salen la escena 3D, las gráficas del dock y las cifras.
 *
 *  1. CAMPO EN EL CORTE (2D, exacto en su modelo). Dos imanes en arco con imantación radial
 *     entre un inducido de hierro y un yugo de hierro (μ → ∞), ferrita/aire con μ = μ₀:
 *        ∇²A_z = −μ₀ (∇×M)_z ,   A_z = Σₙ aₙ(r)·sen(nφ) ,   M_r(φ) = Σₙ Mₙ·cos(nφ)
 *     con B_φ = 0 en las dos caras de hierro y A, ∂A/∂r continuos en la cara del imán. Cada
 *     armónico es una ecuación de Euler con solución cerrada (4 constantes). Dentro del
 *     hierro A es armónica y empalma con el entrehierro. Las LÍNEAS DE CAMPO son las curvas
 *     A_z = cte (entre dos líneas pasa el mismo flujo) y B_r = (1/r)·∂A/∂φ.
 *     La imantación M se ajusta para que la inducción MEDIA que corta la bobina activa sea
 *     la del dominio, B = 0,5 T (sale NdFeB aglomerado: μ₀M ≈ 0,64 T).
 *
 *  2. PAR (fuerza de Lorentz en cada lado, F = N·I·L×B). Dos bobinas a 90° y un conmutador
 *     de cuatro delgas: en cada cuarto de vuelta las escobillas alimentan la bobina cuyos
 *     lados pasan frente a los imanes, con el sentido de corriente que empuja a favor:
 *        τ(θ) = N·I·L·r·[B_r(φ) − B_r(φ+π)] = k·I·G(θ) ,   ⟨G⟩ = 1 por vuelta
 *     Con imanes N–S el campo es impar (B_r(φ+π) = −B_r(φ)) y τ = N·I·A·B_r(φ): oscila con
 *     el ángulo (cae donde el lado sale de debajo del imán) y el conmutador lo devuelve.
 *     Con polos iguales (N–N) el campo es par y las dos fuerzas se anulan como par.
 *
 *  3. MOVIMIENTO. J·dω/dt = τ(θ) − τ_freno, con el freno de partículas como rozamiento de
 *     Coulomb (Karnopp: si está quieto y |τ| ≤ τ_c, no arranca). Corriente media del
 *     inducido: I = (V − ē)/R con ē = k·ω·⟨G⟩ (la autoinducción alisa el rizado de la
 *     conmutación); la fuente no absorbe corriente (I ≥ 0) y «cortar» abre el circuito.
 *     En régimen ⟨τ⟩ = τ_c ⇒ I = τ_c/k y V = k·ω + I·R: EXACTAMENTE el modelo del dominio.
 *
 *  Sentido: θ y ω positivos = HORARIO visto de frente (desde el corte), el mismo convenio
 *  que el signo de las rpm del dominio (izq. N, der. S ⇒ horario).
 */
import { MOTOR, kMotor, rArmadura, type Polo } from '@/domain/fisica';

export const MU0 = 4e-7 * Math.PI;
const GRAD = Math.PI / 180;

/** Geometría (m, rad). A = 2·Rr·L = 20 cm², la del dominio. */
export const GEOM = {
  /** radio del inducido: los lados de la bobina van en sus ranuras, a ras del entrehierro */
  Rr: 0.020,
  /** entrehierro */
  g: 0.0008,
  /** espesor radial de los imanes */
  hm: 0.004,
  /** espesor del yugo (≈ 1,3 T en el punto de trabajo: sin saturar) */
  yugo: 0.007,
  /** longitud activa (imanes y núcleo) */
  L: 0.05,
  /** semiapertura de cada imán */
  alfa: 50 * GRAD,
} as const;
export const R_M = GEOM.Rr + GEOM.g;
export const R_Y = R_M + GEOM.hm;
export const R_O = R_Y + GEOM.yugo;

/** Semiancho de la ventana de conmutación: dos bobinas a 90° → cada una manda ±45°. */
export const VENTANA = Math.PI / 4;
/** Momento de inercia de lo que gira (inducido, conmutador, acople y rotor del freno), kg·m². */
export const J_ROTOR = 1.2e-4;
/** Número de armónicos de la serie de Fourier. */
export const ARMONICOS = 151;

export type TipoCampo = 'dipolo' | 'cuadrupolo';

/** Coeficientes de un armónico n (en ρ = r/Rr). */
interface Armonico {
  n: number;
  /** entrehierro: a = T·(ρⁿ + ρ⁻ⁿ) */
  T: number;
  /** imán: a = P·ρⁿ + Q·ρ⁻ⁿ + ap(ρ) */
  P: number; Q: number;
  /** particular: n ≠ 1 → C·ρ; n = 1 → D·ρ·ln ρ */
  C: number; D: number;
  /** valor en la cara imán–yugo (empalme con el yugo) */
  aY: number;
}

export interface SolucionCampo {
  tipo: TipoCampo;
  /** imantación (A/m) con la que se calculó */
  M: number;
  arm: Armonico[];
}

const RHO_M = R_M / GEOM.Rr, RHO_Y = R_Y / GEOM.Rr, RHO_O = R_O / GEOM.Rr;

/**
 * Mₙ/M para la configuración de referencia de cada tipo:
 *  · dipolo: izq. N (imantación hacia dentro, M_r = −M en φ = π) y der. S (M_r = +M en φ = 0);
 *  · cuadrupolo: los dos N hacia dentro (M_r = −M en los dos arcos).
 * Un arco de semiapertura α centrado en φ₀: α/π + Σ (2·sen nα/(nπ))·cos n(φ − φ₀).
 */
function coefImantacion(tipo: TipoCampo, n: number): number {
  const base = (2 * Math.sin(n * GEOM.alfa)) / (n * Math.PI);
  const par = n % 2 === 0;
  if (tipo === 'dipolo') return par ? 0 : 2 * base;       // σ_der = +1, σ_izq = −1: [1 − (−1)ⁿ]
  return par ? -2 * base : 0;                               // σ = −1 en los dos: −[1 + (−1)ⁿ]
}

/** Resuelve los armónicos del campo para una imantación M (A/m). */
export function solucionCampo(tipo: TipoCampo, M: number): SolucionCampo {
  const arm: Armonico[] = [];
  for (let n = 1; n <= ARMONICOS; n++) {
    const mn = coefImantacion(tipo, n);
    if (mn === 0) continue;
    const s = MU0 * n * M * mn * GEOM.Rr;                   // fuente en ρ: ρ²a'' + ρa' − n²a = −s·ρ
    const C = n === 1 ? 0 : s / (n * n - 1);
    const D = n === 1 ? -s / 2 : 0;
    const ap = (r: number) => (n === 1 ? D * r * Math.log(r) : C * r);
    const dap = (r: number) => (n === 1 ? D * (Math.log(r) + 1) : C);
    const x = Math.pow(RHO_M, n), y = Math.pow(RHO_M, -n);
    // B_φ = 0 en el hierro del inducido (ρ = 1) ⇒ S = T ; continuidad de a y a' en ρ_m
    const u = (ap(RHO_M) + (RHO_M * dap(RHO_M)) / n) / (2 * x);  // T − P
    const w = (ap(RHO_M) - (RHO_M * dap(RHO_M)) / n) / (2 * y);  // T − Q
    const yn = Math.pow(RHO_Y, n), ymn = Math.pow(RHO_Y, -n);
    // B_φ = 0 en el yugo (ρ = ρ_y)
    const T = (-(RHO_Y * dap(RHO_Y)) / n + u * yn - w * ymn) / (yn - ymn);
    const P = T - u, Q = T - w;
    const aY = P * yn + Q * ymn + ap(RHO_Y);
    arm.push({ n, T, P, Q, C, D, aY });
  }
  return { tipo, M, arm };
}

/** aₙ(ρ) y daₙ/dρ en cualquier radio (inducido, entrehierro, imán, yugo; fuera, 0). */
function radial(h: Armonico, rho: number): [number, number] {
  const n = h.n;
  if (rho <= 1) {
    const a1 = 2 * h.T;
    return [a1 * Math.pow(rho, n), n * a1 * Math.pow(rho, n - 1)];
  }
  if (rho <= RHO_M) {
    const pn = Math.pow(rho, n), pmn = Math.pow(rho, -n);
    return [h.T * (pn + pmn), (n * h.T * (pn - pmn)) / rho];
  }
  if (rho <= RHO_Y) {
    const pn = Math.pow(rho, n), pmn = Math.pow(rho, -n);
    const ap = n === 1 ? h.D * rho * Math.log(rho) : h.C * rho;
    const dap = n === 1 ? h.D * (Math.log(rho) + 1) : h.C;
    return [h.P * pn + h.Q * pmn + ap, (n * (h.P * pn - h.Q * pmn)) / rho + dap];
  }
  if (rho <= RHO_O) {
    // yugo: a(ρ_o) = 0 (no sale flujo al aire exterior)
    const f = (r: number) => Math.pow(r / RHO_O, n) - Math.pow(RHO_O / r, n);
    const df = (r: number) => (n / r) * (Math.pow(r / RHO_O, n) + Math.pow(RHO_O / r, n));
    const den = f(RHO_Y);
    return [(h.aY * f(rho)) / den, (h.aY * df(rho)) / den];
  }
  return [0, 0];
}

/** aₙ(r) de todos los armónicos de la solución (Wb/m), en el orden de `sol.arm`. */
export function coefRadiales(sol: SolucionCampo, r: number, out = new Float64Array(sol.arm.length)): Float64Array {
  const rho = r / GEOM.Rr;
  for (let k = 0; k < sol.arm.length; k++) out[k] = radial(sol.arm[k], rho)[0];
  return out;
}

/** Potencial vector A_z (Wb/m) en (r, φ). */
export function potencialA(sol: SolucionCampo, r: number, phi: number): number {
  const rho = r / GEOM.Rr;
  let a = 0;
  for (const h of sol.arm) a += radial(h, rho)[0] * Math.sin(h.n * phi);
  return a;
}

/** B (T) en (r, φ): componentes radial y azimutal. */
export function campoPolar(sol: SolucionCampo, r: number, phi: number, out: [number, number] = [0, 0]): [number, number] {
  const rho = Math.max(1e-9, r / GEOM.Rr);
  let br = 0, bp = 0;
  for (const h of sol.arm) {
    const [a, da] = radial(h, rho);
    br += (h.n * a * Math.cos(h.n * phi)) / (GEOM.Rr * rho);
    bp -= (da / GEOM.Rr) * Math.sin(h.n * phi);
  }
  out[0] = br; out[1] = bp;
  return out;
}

/** B_r (T) en la superficie del inducido (lado del entrehierro), donde van los lados de las bobinas. */
export function brEntrehierro(sol: SolucionCampo, phi: number): number {
  let br = 0;
  for (const h of sol.arm) br += (h.n * 2 * h.T * Math.cos(h.n * phi)) / GEOM.Rr;
  return br;
}

/** Media de B_r en la ventana de la bobina activa (|φ| ≤ 45°), por cuadratura de Simpson. */
function mediaVentana(sol: SolucionCampo): number {
  const n = 720;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const phi = -VENTANA + (2 * VENTANA * i) / n;
    s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * brEntrehierro(sol, phi);
  }
  return s / (3 * n);
}

/** Imantación (A/m) que da B = 0,5 T de media en la ventana (dominio). */
export const M_IMAN = MOTOR.B / mediaVentana(solucionCampo('dipolo', 1));
/** Remanencia equivalente de los imanes, μ₀·M (T). */
export const REMANENCIA = MU0 * M_IMAN;

const cacheSol = new Map<TipoCampo, SolucionCampo>();
/** Solución del campo con la imantación real (memoizada). */
export function campo(tipo: TipoCampo): SolucionCampo {
  let s = cacheSol.get(tipo);
  if (!s) { s = solucionCampo(tipo, M_IMAN); cacheSol.set(tipo, s); }
  return s;
}

// ───────────────────────────── configuración de los imanes ─────────────────────────────

export interface ConfigImanes {
  tipo: TipoCampo;
  /** +1: la de referencia (N–S o N–N); −1: invertida (S–N o S–S) */
  signo: 1 | -1;
  /** signo del par medio (dominio `signoCampo`): +1 horario, −1 antihorario, 0 sin campo */
  sentido: 1 | -1 | 0;
}

export function configImanes(izq: Polo, der: Polo): ConfigImanes {
  if (izq === der) return { tipo: 'cuadrupolo', signo: izq === 'N' ? 1 : -1, sentido: 0 };
  const s = izq === 'N' ? 1 : -1;
  return { tipo: 'dipolo', signo: s, sentido: s };
}

/** B_r en el entrehierro con la configuración real. */
export function brConfig(c: ConfigImanes, phi: number): number {
  return c.signo * brEntrehierro(campo(c.tipo), phi);
}

// ───────────────────────────── conmutador y par ─────────────────────────────

const envolver = (x: number, p: number) => x - p * Math.floor(x / p + 0.5); // a (−p/2, p/2]

/**
 * Bobina activa y ángulo de su lado «derecho» (el que pasa frente al imán derecho, |φ| ≤ 45°).
 * El inducido gira θ en sentido horario visto de frente: el lado 1 de la bobina A está en
 * φ = −θ y el de la B en φ = 90° − θ (φ antihorario desde +x, el imán derecho).
 */
export function bobinaActiva(theta: number): { bobina: 0 | 1; phiR: number } {
  const pA = envolver(-theta, Math.PI);
  if (Math.abs(pA) <= VENTANA) return { bobina: 0, phiR: pA };
  return { bobina: 1, phiR: envolver(Math.PI / 2 - theta, Math.PI) };
}

/**
 * Forma del par G(θ) del campo DIPOLAR de referencia: [B_r(φ) − B_r(φ+π)]/(2B) = B_r(φ)/B.
 * Tabla en la ventana (el par conmutado tiene periodo 90°). ⟨G⟩ = 1 por construcción.
 */
const N_TABLA = 1440;
const TABLA_G = (() => {
  const sol = campo('dipolo');
  const t = new Float64Array(N_TABLA + 1);
  for (let i = 0; i <= N_TABLA; i++) {
    const phi = -VENTANA + (2 * VENTANA * i) / N_TABLA;
    t[i] = (brEntrehierro(sol, phi) - brEntrehierro(sol, phi + Math.PI)) / (2 * MOTOR.B);
  }
  return t;
})();

function gVentana(phiR: number): number {
  const x = ((phiR + VENTANA) / (2 * VENTANA)) * N_TABLA;
  const i = Math.min(N_TABLA - 1, Math.max(0, Math.floor(x)));
  const f = Math.min(1, Math.max(0, x - i));
  return TABLA_G[i] * (1 - f) + TABLA_G[i + 1] * f;
}

/** G(θ) con la configuración real (0 con polos iguales). */
export function formaPar(c: ConfigImanes, theta: number): number {
  if (c.tipo !== 'dipolo') return 0;
  return c.signo * gVentana(bobinaActiva(theta).phiR);
}

/** Mínimo y máximo de G en la ventana (dipolo de referencia). */
export const G_EXTREMOS = (() => {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= N_TABLA; i++) { lo = Math.min(lo, TABLA_G[i]); hi = Math.max(hi, TABLA_G[i]); }
  return { min: lo, max: hi };
})();

/** Par instantáneo (N·m, + horario) de la bobina que alimenta el conmutador. */
export function parInstantaneo(c: ConfigImanes, N: number, I: number, theta: number): number {
  if (c.tipo !== 'dipolo') return 0;
  return kMotor(N) * I * formaPar(c, theta);
}

/**
 * Par de la bobina A si estuviera SIEMPRE conectada igual (anillos rozantes, sin conmutador):
 * k·I·[B_r(φ) − B_r(φ+π)]/(2B) con φ = −θ. Cambia de signo cada media vuelta: media nula.
 */
export function parSinConmutador(c: ConfigImanes, N: number, I: number, theta: number): number {
  if (c.tipo !== 'dipolo') return 0;
  const phi = -theta;
  return (kMotor(N) * I * (brConfig(c, phi) - brConfig(c, phi + Math.PI))) / (2 * MOTOR.B);
}

/** f.e.m. instantánea de la bobina activa (V) y la media por vuelta. */
export const fcemInstantanea = (c: ConfigImanes, N: number, omega: number, theta: number) => kMotor(N) * omega * formaPar(c, theta);
export const fcemMedia = (c: ConfigImanes, N: number, omega: number) => kMotor(N) * omega * c.sentido;

export interface Lado {
  /** posición angular del lado (rad, antihorario desde el imán derecho) */
  phi: number;
  /** +1: corriente hacia el observador (⊙); −1: hacia dentro (⊗) */
  corriente: 1 | -1;
  /** fuerza tangencial (N): + antihoraria (φ̂) */
  Fphi: number;
  /** B_r en el lado (T) */
  Br: number;
}

/**
 * Los dos lados de la bobina activa con su corriente y su fuerza de Lorentz F = N·I·L·B_r
 * (tangencial). El lado derecho lleva la corriente hacia dentro (⊗) y el izquierdo hacia
 * fuera (⊙): con N a la izquierda y S a la derecha, las dos fuerzas giran en sentido horario.
 */
export function ladosActivos(c: ConfigImanes, N: number, I: number, theta: number): { bobina: 0 | 1; lados: [Lado, Lado] } {
  const { bobina, phiR } = bobinaActiva(theta);
  const mk = (phi: number, corriente: 1 | -1): Lado => {
    const Br = brConfig(c, phi);
    return { phi, corriente, Br, Fphi: corriente * N * I * GEOM.L * Br };
  };
  return { bobina, lados: [mk(phiR, -1), mk(phiR + Math.PI, 1)] };
}

// ───────────────────────────── movimiento ─────────────────────────────

export interface ParamsMotor {
  V: number;
  N: number;
  izq: Polo;
  der: Polo;
  /** par del freno (N·m) */
  carga: number;
  /** circuito cerrado (fuente conectada) */
  energizado: boolean;
}

export interface EstadoDin {
  /** tiempo de modelo (s) */
  t: number;
  /** ángulo del inducido (rad, + horario) */
  theta: number;
  /** velocidad angular (rad/s, + horario) */
  omega: number;
  /** corriente de la fuente (A) */
  I: number;
  /** par motor instantáneo (N·m) */
  tau: number;
  /** par del freno (N·m, se opone al giro) */
  tauFreno: number;
  /** pegado por el freno (rozamiento estático) */
  quieto: boolean;
}

export const estadoInicial = (theta = 0): EstadoDin => ({ t: 0, theta, omega: 0, I: 0, tau: 0, tauFreno: 0, quieto: true });

/** Corriente media de la fuente: I = (V − ē)/R, sin absorber (I ≥ 0); circuito abierto → 0. */
export function corriente(p: ParamsMotor, c: ConfigImanes, omega: number): number {
  if (!p.energizado || p.V <= 0) return 0;
  return Math.max(0, (p.V - fcemMedia(c, p.N, omega)) / rArmadura(p.N));
}

const OMEGA_EPS = 1e-3; // rad/s: por debajo, el freno puede pegarlo

/** Un paso de integración (h en s de modelo; h ≤ 1e-4 s recomendado). Muta y devuelve `e`. */
export function paso(e: EstadoDin, p: ParamsMotor, c: ConfigImanes, h: number): EstadoDin {
  const I = corriente(p, c, e.omega);
  const tau = parInstantaneo(c, p.N, I, e.theta);
  const tc = Math.max(0, p.carga);
  let w = e.omega, freno = 0, quieto = false;
  if (Math.abs(w) < OMEGA_EPS) {
    if (Math.abs(tau) <= tc) { w = 0; freno = -tau; quieto = true; }
    else { freno = -tc * Math.sign(tau); w += (h * (tau + freno)) / J_ROTOR; }
  } else {
    freno = -tc * Math.sign(w);
    const wn = w + (h * (tau + freno)) / J_ROTOR;
    w = Math.sign(wn) !== Math.sign(w) ? 0 : wn;          // el freno para, no invierte
  }
  e.theta += h * w;
  e.omega = w;
  e.t += h;
  e.I = I; e.tau = tau; e.tauFreno = freno; e.quieto = quieto;
  return e;
}

/** Avanza `dt` segundos de modelo en subpasos de como mucho `hMax`. */
export function avanzar(e: EstadoDin, p: ParamsMotor, dt: number, hMax = 1e-4): EstadoDin {
  if (!(dt > 0)) return e;
  const c = configImanes(p.izq, p.der);
  const n = Math.max(1, Math.ceil(dt / hMax));
  const h = dt / n;
  for (let i = 0; i < n; i++) paso(e, p, c, h);
  return e;
}

/** Constante de tiempo mecánica τ_m = J·R/k² (s). */
export const tauMecanica = (N: number) => (J_ROTOR * rArmadura(N)) / (kMotor(N) * kMotor(N));

export interface Regimen {
  arranca: boolean;
  omega: number;
  rpm: number;
  I: number;
  /** f.c.e.m. media (V) */
  E: number;
  /** potencias (W): eléctrica, Joule, útil (al freno) */
  Pel: number; Pjoule: number; Putil: number;
  /** rendimiento (0–1) */
  eta: number;
}

/** Régimen permanente del modelo de valores medios (el del dominio, con potencias). */
export function regimen(p: Omit<ParamsMotor, 'energizado'>): Regimen {
  const c = configImanes(p.izq, p.der);
  const k = kMotor(p.N), R = rArmadura(p.N);
  if (c.sentido === 0 || p.V <= 0) {
    const I = p.V > 0 ? p.V / R : 0;
    return { arranca: false, omega: 0, rpm: 0, I, E: 0, Pel: p.V * I, Pjoule: I * I * R, Putil: 0, eta: 0 };
  }
  const I = p.carga / k;
  const E = p.V - I * R;
  if (E <= 0) {
    const Is = p.V / R;
    return { arranca: false, omega: 0, rpm: 0, I: Is, E: 0, Pel: p.V * Is, Pjoule: Is * Is * R, Putil: 0, eta: 0 };
  }
  const w = (c.sentido * E) / k;
  const Pel = p.V * I;
  return { arranca: true, omega: w, rpm: (w * 60) / (2 * Math.PI), I, E, Pel, Pjoule: I * I * R, Putil: p.carga * Math.abs(w), eta: (p.carga * Math.abs(w)) / Pel };
}

/** rpm a partir de ω (rad/s). */
export const aRpm = (w: number) => (w * 60) / (2 * Math.PI);
