/**
 * qmi02/cinetica.ts — LA FÍSICA del gas (módulo puro: sin three ni React).
 *
 * El gas de la cámara es una MUESTRA de N «esferas» que representan los n moles
 * reales: cada esfera lleva la masa n·M/N, de modo que la masa total es la del gas.
 *
 *  · VELOCIDADES de Maxwell–Boltzmann a la T de las paredes: cada componente es una
 *    gaussiana de varianza RT/M (m/s). Rapidez más probable v_p = √(2RT/M), media
 *    ⟨v⟩ = √(8RT/πM) y cuadrática media v_rms = √(3RT/M).
 *  · PAREDES TÉRMICAS (fondo y cuarzo, a la T del termostato): la molécula que choca
 *    sale con la distribución de la pared (acomodación completa): normal de Rayleigh
 *    σ·√(−2 ln U) y tangenciales gaussianas, σ = √(RT/M). Así entra y sale el calor.
 *  · PISTÓN: pared especular (rebote elástico). Se mueve a tiempo real; para las
 *    moléculas, a cámara lenta, el proceso es cuasiestático: la columna de gas se
 *    estira o se comprime de forma afín.
 *  · CHOQUES ENTRE ESFERAS: esferas duras de masas iguales, elásticos: se intercambia
 *    la componente de la velocidad relativa sobre la línea de centros (se conservan
 *    la energía y el momento exactamente).
 *  · PRESIÓN POR IMPULSOS: cada choque con una pared le entrega m·Δv_n; la suma de
 *    impulsos / (área de las paredes × tiempo real) es la presión, en pascales. Con la
 *    teoría cinética, su valor esperado es N·m·⟨v²⟩/(3V) = nRT/V: PV = nRT EMERGE.
 *
 * Unidades: posiciones en u = dm (1 u³ = 1 L, como el kit), velocidades en m/s,
 * tiempo REAL en s (la escena lo avanza con su factor de cámara lenta).
 */

// ───────────────────────────── constantes ─────────────────────────────

/** J/(mol·K) — CODATA 2018 (exacta). */
export const R_J = 8.314462618;
/** L·atm/(mol·K) = R_J / 101,325. */
export const R_ATM = R_J / 101.325;
/** Pa por atm. */
export const ATM_PA = 101325;
export const N_A = 6.02214076e23;
export const K_B = 1.380649e-23;
/** Temperatura de la botella de gas (laboratorio). */
export const T_AMBIENTE = 293.15;
/** u (dm) por metro. */
export const U_POR_M = 10;

export type IdGas = 'He' | 'Ne' | 'CO2';
export const GASES: Record<IdGas, { M: number; nombre: string; formula: string }> = {
  // masas molares IUPAC (g/mol)
  He: { M: 4.002602, nombre: 'Helio', formula: 'He' },
  Ne: { M: 20.1797, nombre: 'Neón', formula: 'Ne' },
  CO2: { M: 44.0095, nombre: 'Dióxido de carbono', formula: 'CO₂' },
};
export const esGas = (g: unknown): g is IdGas => g === 'He' || g === 'Ne' || g === 'CO2';
/** kg/mol */
export const masaMolar = (g: IdGas) => GASES[g].M / 1000;

// ───────────────────────────── la cámara (cotas compartidas con la escena) ─────────────────────────────

export const CAMARA = {
  /** radio interior del cilindro de cuarzo (u = dm) */
  R: 1.3,
  /** cara superior de la placa termostática: el suelo del gas (u) */
  yFondo: 0.72,
  /** altura interior útil hasta la tapa (u) */
  altoUtil: 3.25,
  vMin: 2,
  vMax: 15,
};
/** dm² (1 dm² · 1 dm = 1 L). */
export const AREA_DM2 = Math.PI * CAMARA.R * CAMARA.R;
/** Altura de la columna de gas (u = dm) para V litros. */
export const alturaGas = (V: number) => V / AREA_DM2;
/** Volumen (L) para una altura de columna h (dm). */
export const volumenDeAltura = (h: number) => h * AREA_DM2;
/** Cara inferior de la tapa (u). */
export const Y_TAPA = CAMARA.yFondo + CAMARA.altoUtil;
/** Área de todas las paredes que tocan el gas (m²) para una columna de h dm. */
export function areaParedes(h: number): number {
  const R = CAMARA.R;
  return (2 * Math.PI * R * R + 2 * Math.PI * R * h) / 100;
}

// ───────────────────────────── gas ideal y Maxwell–Boltzmann ─────────────────────────────

/** P = nRT/V en atm (V en L). */
export const presionLey = (n: number, T: number, V: number) => (n * R_ATM * T) / Math.max(1e-9, V);

/** Rapidez más probable (m/s). */
export const vProbable = (T: number, M: number) => Math.sqrt((2 * R_J * T) / M);
/** Rapidez media (m/s). */
export const vMedia = (T: number, M: number) => Math.sqrt((8 * R_J * T) / (Math.PI * M));
/** Rapidez cuadrática media (m/s). */
export const vRms = (T: number, M: number) => Math.sqrt((3 * R_J * T) / M);

/** Densidad de probabilidad de Maxwell–Boltzmann de la rapidez (por m/s). M en kg/mol. */
export function maxwellBoltzmann(v: number, T: number, M: number): number {
  if (v < 0) return 0;
  const a = M / (2 * R_J * T);
  return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v);
}

/** Temperatura «equivalente» de una molécula: la T cuya energía media sería la suya. */
export const temperaturaDeRapidez = (v: number, M: number) => (M * v * v) / (3 * R_J);

// ───────────────────────────── color por energía (frío azul → caliente rojo) ─────────────────────────────

/**
 * La esfera se colorea por su energía cinética ½mv², expresada como temperatura
 * equivalente Mv²/(3R) en escala logarítmica de 40 K a 2500 K. A la misma T, los tres
 * gases tienen la MISMA mezcla de colores (aunque el He corra 3,3 veces más que el CO₂).
 */
const PARADAS: [number, [number, number, number]][] = [
  [0, [0.15, 0.27, 0.86]],
  [0.3, [0.16, 0.74, 0.95]],
  [0.5, [0.86, 0.94, 1.0]],
  [0.66, [1.0, 0.82, 0.38]],
  [0.83, [1.0, 0.46, 0.17]],
  [1, [0.96, 0.19, 0.15]],
];
const LOG_T0 = Math.log(40), LOG_T1 = Math.log(2500);
/** 0…1 en la escala de color para una temperatura equivalente (K). */
export const indiceColor = (Teq: number) => Math.max(0, Math.min(1, (Math.log(Math.max(1, Teq)) - LOG_T0) / (LOG_T1 - LOG_T0)));
/** Color sRGB (0…1) de una temperatura equivalente. */
export function colorTemperatura(Teq: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const t = indiceColor(Teq);
  let k = 1;
  while (k < PARADAS.length - 1 && PARADAS[k][0] < t) k++;
  const [t0, c0] = PARADAS[k - 1], [t1, c1] = PARADAS[k];
  const u = (t - t0) / Math.max(1e-9, t1 - t0);
  out[0] = c0[0] + (c1[0] - c0[0]) * u;
  out[1] = c0[1] + (c1[1] - c0[1]) * u;
  out[2] = c0[2] + (c1[2] - c0[2]) * u;
  return out;
}
/** Color de una rapidez v (m/s) de un gas de masa molar M (kg/mol). */
export const colorRapidez = (v: number, M: number, out?: [number, number, number]) => colorTemperatura(temperaturaDeRapidez(v, M), out);

// ───────────────────────────── azar reproducible ─────────────────────────────

/** mulberry32: generador determinista (pruebas y capturas repetibles). */
export function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gaussiana estándar (Box–Muller) a partir de un uniforme. */
export function gaussiana(rnd: () => number): () => number {
  let guardada: number | null = null;
  return () => {
    if (guardada !== null) { const g = guardada; guardada = null; return g; }
    const u = Math.max(1e-300, rnd()), w = rnd();
    const r = Math.sqrt(-2 * Math.log(u));
    guardada = r * Math.sin(2 * Math.PI * w);
    return r * Math.cos(2 * Math.PI * w);
  };
}

/** Componente normal con que una pared térmica reemite (Rayleigh de parámetro σ). */
export const normalPared = (sigma: number, u: number) => sigma * Math.sqrt(-2 * Math.log(Math.max(1e-300, 1 - u)));

// ───────────────────────────── choque elástico ─────────────────────────────

/**
 * Choque elástico de dos esferas de IGUAL masa con línea de centros (nx, ny, nz)
 * unitaria: se intercambian las componentes normales de la velocidad. Modifica `a` y
 * `b` (vectores [vx, vy, vz]) y devuelve la componente normal relativa intercambiada.
 */
export function choqueElastico(a: number[] | Float64Array, b: number[] | Float64Array, nx: number, ny: number, nz: number): number {
  const g = (a[0] - b[0]) * nx + (a[1] - b[1]) * ny + (a[2] - b[2]) * nz;
  a[0] -= g * nx; a[1] -= g * ny; a[2] -= g * nz;
  b[0] += g * nx; b[1] += g * ny; b[2] += g * nz;
  return g;
}

// ───────────────────────────── la muestra cinética ─────────────────────────────

export interface OpcionesGas {
  semilla?: number;
  /** esferas por mol de gas (por defecto 400) */
  porMol?: number;
  /** diámetro de choque entre esferas (u) */
  diametro?: number;
  /** 'termicas': fondo y cuarzo a la T del termostato; 'especulares': rebote elástico (prueba de conservación) */
  paredes?: 'termicas' | 'especulares';
  /** máximo de esferas */
  capacidad?: number;
}

export const POR_MOL = 400;
/** Diámetro de choque entre esferas (u = dm): 4,5 mm. Las esferas se dibujan de 7 mm. */
export const DIAMETRO_CHOQUE = 0.045;
export const CAPACIDAD = 900;
const CELDA = 0.15;

/** Contadores de lo que pasó en un intervalo (los lee y reinicia el reloj). */
export interface Contadores {
  /** ∫ (impulso / área) = Pa·s */
  pdt: number;
  /** s reales */
  t: number;
  choquesPared: number;
  choquesEntre: number;
  /** J que entraron al gas desde las paredes térmicas */
  calor: number;
}

export class GasCinetico {
  readonly cap: number;
  readonly porMol: number;
  readonly diametro: number;
  readonly paredes: 'termicas' | 'especulares';
  /** esferas activas */
  N = 0;
  x: Float64Array; y: Float64Array; z: Float64Array;
  vx: Float64Array; vy: Float64Array; vz: Float64Array;
  gas: IdGas;
  /** kg/mol */
  M: number;
  /** T de las paredes (K) */
  T: number;
  /** moles que representa la muestra */
  n: number;
  /** masa de cada esfera (kg) */
  masa = 0;
  /** plano del pistón (centros), u */
  yTecho: number;
  /** la cámara perdió el pistón (explosión): el gas escapa por arriba */
  abierta = false;
  rnd: () => number;
  gauss: () => number;
  cont: Contadores = { pdt: 0, t: 0, choquesPared: 0, choquesEntre: 0, calor: 0 };
  /** rapidez máxima del último paso (m/s): fija los subpasos */
  private vMax = 0;
  // rejilla de choques
  private nx: number; private nz: number; private ny: number;
  private cabeza: Int32Array; private siguiente: Int32Array;
  /** sello por celda: una celda con sello viejo está vacía (no hace falta vaciar la rejilla) */
  private marca: Int32Array; private sello = 0;
  private tmpA = new Float64Array(3); private tmpB = new Float64Array(3);

  constructor(estado: { gas: IdGas; T: number; V: number; n: number }, op: OpcionesGas = {}) {
    this.cap = op.capacidad ?? CAPACIDAD;
    this.porMol = op.porMol ?? POR_MOL;
    this.diametro = op.diametro ?? DIAMETRO_CHOQUE;
    this.paredes = op.paredes ?? 'termicas';
    this.rnd = azar(op.semilla ?? 2024);
    this.gauss = gaussiana(this.rnd);
    const c = this.cap;
    this.x = new Float64Array(c); this.y = new Float64Array(c); this.z = new Float64Array(c);
    this.vx = new Float64Array(c); this.vy = new Float64Array(c); this.vz = new Float64Array(c);
    this.gas = estado.gas; this.M = masaMolar(estado.gas); this.T = estado.T; this.n = estado.n;
    this.yTecho = CAMARA.yFondo + alturaGas(estado.V);
    this.nx = Math.ceil((2 * CAMARA.R) / CELDA) + 1;
    this.nz = this.nx;
    this.ny = Math.ceil(CAMARA.altoUtil / CELDA) + 2;
    this.cabeza = new Int32Array(this.nx * this.ny * this.nz);
    this.marca = new Int32Array(this.nx * this.ny * this.nz);
    this.siguiente = new Int32Array(c);
    this.poblar(estado.n);
  }

  private medirVMax() {
    let v2 = 0;
    for (let i = 0; i < this.N; i++) v2 = Math.max(v2, this.vx[i] ** 2 + this.vy[i] ** 2 + this.vz[i] ** 2);
    this.vMax = Math.sqrt(v2);
  }

  /** Esferas que corresponden a n moles. */
  esferasDe(n: number) { return Math.max(1, Math.min(this.cap, Math.round(n * this.porMol))); }

  private fijarMasa() { this.masa = (this.n * this.M) / Math.max(1, this.N); }

  /** σ de cada componente de la velocidad a la temperatura T (m/s). */
  sigma(T = this.T) { return Math.sqrt((R_J * T) / this.M); }

  /** Reparte de nuevo todas las esferas: posiciones uniformes y velocidades de MB a T. */
  poblar(n: number) {
    this.n = n;
    this.N = this.esferasDe(n);
    this.abierta = false;
    const s = this.sigma();
    const h = this.yTecho - CAMARA.yFondo;
    for (let i = 0; i < this.N; i++) {
      const a = this.rnd() * Math.PI * 2, r = Math.sqrt(this.rnd()) * CAMARA.R;
      this.x[i] = Math.cos(a) * r; this.z[i] = Math.sin(a) * r;
      this.y[i] = CAMARA.yFondo + this.rnd() * h;
      this.vx[i] = this.gauss() * s; this.vy[i] = this.gauss() * s; this.vz[i] = this.gauss() * s;
    }
    this.fijarMasa();
    this.medirVMax();
  }

  /** Temperatura de las paredes (el termostato). */
  fijarTemperatura(T: number) { this.T = T; }

  /** Otro gas a la misma T: las rapideces escalan con √(M_viejo/M_nuevo) (la distribución se conserva). */
  cambiarGas(gas: IdGas) {
    if (gas === this.gas) return;
    const k = Math.sqrt(this.M / masaMolar(gas));
    for (let i = 0; i < this.N; i++) { this.vx[i] *= k; this.vy[i] *= k; this.vz[i] *= k; }
    this.gas = gas; this.M = masaMolar(gas);
    this.fijarMasa();
    this.vMax *= k;
  }

  /**
   * El pistón pasa a `yNuevo`. Cuasiestático: la columna de gas se estira o comprime
   * de forma afín (la densidad sigue uniforme) y las velocidades no cambian.
   */
  moverPiston(yNuevo: number) {
    const h0 = this.yTecho - CAMARA.yFondo, h1 = yNuevo - CAMARA.yFondo;
    if (Math.abs(h1 - h0) < 1e-12) return;
    if (!this.abierta) {
      const k = h1 / Math.max(1e-9, h0);
      for (let i = 0; i < this.N; i++) this.y[i] = CAMARA.yFondo + (this.y[i] - CAMARA.yFondo) * k;
    }
    this.yTecho = yNuevo;
  }

  /**
   * Entran `k` esferas por la válvula (borde del fondo, a la izquierda), con la
   * distribución que emite una boquilla a la temperatura de la botella. Suben los
   * moles a `n`.
   */
  inyectar(k: number, n: number, Tentrada = T_AMBIENTE) {
    const s = Math.sqrt((R_J * Tentrada) / this.M);
    let añadidas = 0;
    for (let j = 0; j < k && this.N < this.cap; j++) {
      const i = this.N++;
      this.x[i] = -CAMARA.R + 0.03; this.y[i] = CAMARA.yFondo + 0.05 + this.rnd() * 0.05; this.z[i] = (this.rnd() - 0.5) * 0.12;
      this.vx[i] = normalPared(s, this.rnd()); this.vy[i] = this.gauss() * s; this.vz[i] = this.gauss() * s;
      añadidas++;
    }
    this.n = n;
    this.fijarMasa();
    this.medirVMax();
    return añadidas;
  }

  /** Sin pistón: el gas escapa por la boca. */
  abrir() { this.abierta = true; }

  /** Energía cinética total (J). */
  energia(): number {
    let s = 0;
    for (let i = 0; i < this.N; i++) s += this.vx[i] ** 2 + this.vy[i] ** 2 + this.vz[i] ** 2;
    return 0.5 * this.masa * s;
  }
  /** Momento total (kg·m/s). */
  momento(): [number, number, number] {
    let a = 0, b = 0, c = 0;
    for (let i = 0; i < this.N; i++) { a += this.vx[i]; b += this.vy[i]; c += this.vz[i]; }
    return [a * this.masa, b * this.masa, c * this.masa];
  }
  /** ⟨v²⟩ de la muestra (m²/s²). */
  v2Medio(): number {
    let s = 0;
    for (let i = 0; i < this.N; i++) s += this.vx[i] ** 2 + this.vy[i] ** 2 + this.vz[i] ** 2;
    return this.N ? s / this.N : 0;
  }
  /** Temperatura cinética de la muestra: M⟨v²⟩/(3R). */
  temperaturaMuestra() { return (this.M * this.v2Medio()) / (3 * R_J); }
  /** Presión cinética instantánea N·m·⟨v²⟩/(3V) en Pa (V de la columna actual). */
  presionCinetica(): number {
    const V = volumenDeAltura(this.yTecho - CAMARA.yFondo) / 1000; // m³
    return (this.N * this.masa * this.v2Medio()) / (3 * V);
  }

  /** Avanza `dtReal` segundos reales, con subpasos que no dejan pasar choques. */
  paso(dtReal: number) {
    if (!(dtReal > 0) || this.N === 0) return;
    const desplMax = this.vMax * dtReal * U_POR_M;
    const sub = Math.min(48, Math.max(1, Math.ceil(desplMax / (0.5 * this.diametro))));
    const h = dtReal / sub;
    for (let k = 0; k < sub; k++) this.subpaso(h);
  }

  private subpaso(dt: number) {
    const R = CAMARA.R, R2 = R * R, y0 = CAMARA.yFondo;
    const termicas = this.paredes === 'termicas';
    const s = this.sigma();
    const m = this.masa;
    const f = dt * U_POR_M;
    const A = areaParedes(this.yTecho - y0);
    const X = this.x, Y = this.y, Z = this.z, VX = this.vx, VY = this.vy, VZ = this.vz;
    const techo = this.yTecho, abierta = this.abierta, rnd = this.rnd, gauss = this.gauss;
    let J = 0, choques = 0, calor = 0, vmax2 = 0;
    for (let i = 0, N = this.N; i < N; i++) {
      let vx = VX[i], vy = VY[i], vz = VZ[i];
      const x0 = X[i], z0 = Z[i];
      let x = x0 + vx * f, y = Y[i] + vy * f, z = z0 + vz * f;
      // ── fondo (térmico) ──
      if (y < y0) {
        const vin = -vy;
        if (termicas) {
          const e0 = vx * vx + vy * vy + vz * vz;
          const vout = normalPared(s, rnd());
          vy = vout; vx = gauss() * s; vz = gauss() * s;
          calor += 0.5 * m * (vx * vx + vy * vy + vz * vz - e0);
          // el resto del subpaso (fracción que quedaba tras tocar el fondo) con la velocidad nueva
          const resto = Math.min(1, Math.max(0, (y0 - y) / Math.max(1e-12, vin * f)));
          y = y0 + vout * f * resto;
          x = x0 + (x - x0) * (1 - resto) + vx * f * resto;
          z = z0 + (z - z0) * (1 - resto) + vz * f * resto;
          J += m * (vin + vout);
        } else {
          vy = vin; y = 2 * y0 - y; J += 2 * m * vin;
        }
        choques++;
      }
      // ── pistón (especular) o boca abierta ──
      if (!abierta && y > techo) {
        J += 2 * m * vy;
        vy = -vy;
        y = 2 * techo - y;
        if (y < y0) y = y0 + 1e-6;
        choques++;
      }
      // ── pared de cuarzo (térmica), sólo dentro del cilindro ──
      const r2 = x * x + z * z;
      if (r2 > R2 && y <= Y_TAPA) {
        const r = Math.sqrt(r2);
        const ex = x / r, ez = z / r;            // normal hacia fuera
        const vin = vx * ex + vz * ez;
        if (vin > 0) {
          if (termicas) {
            const e0 = vx * vx + vy * vy + vz * vz;
            const vout = normalPared(s, rnd());
            const vt = gauss() * s;               // tangencial azimutal
            vy = gauss() * s;                     // tangencial axial
            vx = -vout * ex - vt * ez;
            vz = -vout * ez + vt * ex;
            calor += 0.5 * m * (vx * vx + vy * vy + vz * vz - e0);
            const resto = Math.min(1, Math.max(0, (r - R) / Math.max(1e-12, vin * f)));
            x = ex * R + vx * f * resto; z = ez * R + vz * f * resto;
            J += m * (vin + vout);
          } else {
            vx -= 2 * vin * ex; vz -= 2 * vin * ez;
            const rr = 2 * R - r;
            x = ex * rr; z = ez * rr;
            J += 2 * m * vin;
          }
          choques++;
        } else {
          x = ex * R; z = ez * R;
        }
      }
      X[i] = x; Y[i] = y; Z[i] = z;
      VX[i] = vx; VY[i] = vy; VZ[i] = vz;
      const v2 = vx * vx + vy * vy + vz * vz;
      if (v2 > vmax2) vmax2 = v2;
    }
    this.chocarEntreSi();
    this.vMax = Math.sqrt(vmax2);
    if (this.abierta) this.retirarEscapadas();
    this.cont.pdt += J / A;
    this.cont.t += dt;
    this.cont.choquesPared += choques;
    this.cont.calor += calor;
  }

  /** Choques elásticos entre esferas (rejilla de celdas de 15 mm). */
  private chocarEntreSi() {
    const { nx, ny, nz, cabeza, siguiente, marca } = this;
    const X = this.x, Y = this.y, Z = this.z, VX = this.vx, VY = this.vy, VZ = this.vz;
    const d = this.diametro, d2 = d * d;
    const R = CAMARA.R, y0 = CAMARA.yFondo, inv = 1 / CELDA;
    const sello = ++this.sello;
    const N = this.N;
    for (let i = 0; i < N; i++) {
      const cx = Math.floor((X[i] + R) * inv), cy = Math.floor((Y[i] - y0) * inv), cz = Math.floor((Z[i] + R) * inv);
      if (cx < 0 || cy < 0 || cz < 0 || cx >= nx || cy >= ny || cz >= nz) { siguiente[i] = -2; continue; }
      const c = (cy * nz + cz) * nx + cx;
      if (marca[c] !== sello) { marca[c] = sello; cabeza[c] = -1; }
      siguiente[i] = cabeza[c]; cabeza[c] = i;
    }
    let choques = 0;
    for (let i = 0; i < N; i++) {
      if (siguiente[i] === -2) continue;
      const xi = X[i], yi = Y[i], zi = Z[i];
      const cx = Math.floor((xi + R) * inv), cy = Math.floor((yi - y0) * inv), cz = Math.floor((zi + R) * inv);
      for (let yy = Math.max(0, cy - 1), y1 = Math.min(ny - 1, cy + 1); yy <= y1; yy++) {
        for (let zz = Math.max(0, cz - 1), z1 = Math.min(nz - 1, cz + 1); zz <= z1; zz++) {
          for (let xx = Math.max(0, cx - 1), x1 = Math.min(nx - 1, cx + 1); xx <= x1; xx++) {
            const cc = (yy * nz + zz) * nx + xx;
            if (marca[cc] !== sello) continue;
            for (let j = cabeza[cc]; j >= 0; j = siguiente[j]) {
              if (j <= i) continue;
              const rx = xi - X[j], ry = yi - Y[j], rz = zi - Z[j];
              const r2 = rx * rx + ry * ry + rz * rz;
              if (r2 >= d2 || r2 < 1e-18) continue;
              const r = Math.sqrt(r2);
              const ex = rx / r, ey = ry / r, ez = rz / r;
              // sólo si se acercan; el mismo intercambio que `choqueElastico`
              const g = (VX[i] - VX[j]) * ex + (VY[i] - VY[j]) * ey + (VZ[i] - VZ[j]) * ez;
              if (g >= 0) continue;
              VX[i] -= g * ex; VY[i] -= g * ey; VZ[i] -= g * ez;
              VX[j] += g * ex; VY[j] += g * ey; VZ[j] += g * ez;
              choques++;
            }
          }
        }
      }
    }
    this.cont.choquesEntre += choques;
  }

  /** Con la cámara abierta, las esferas que ya salieron lejos se retiran. */
  private retirarEscapadas() {
    const techo = Y_TAPA + 6;
    for (let i = 0; i < this.N; i++) {
      if (this.y[i] > techo) {
        const u = --this.N;
        this.x[i] = this.x[u]; this.y[i] = this.y[u]; this.z[i] = this.z[u];
        this.vx[i] = this.vx[u]; this.vy[i] = this.vy[u]; this.vz[i] = this.vz[u];
        i--;
      }
    }
  }

  /** Lee y reinicia los contadores. */
  tomarContadores(): Contadores {
    const c = this.cont;
    this.cont = { pdt: 0, t: 0, choquesPared: 0, choquesEntre: 0, calor: 0 };
    return c;
  }
}

// ───────────────────────────── el brillo de la placa caliente (Planck) ─────────────────────────────

const C2 = 1.438776877e-2; // m·K (segunda constante de radiación)

/** Radiancia espectral de Planck relativa: λ⁻⁵/(e^(c₂/λT) − 1), con λ en nm. */
export function planck(lambdaNm: number, T: number): number {
  const l = lambdaNm * 1e-9;
  const x = C2 / (l * T);
  return x > 700 ? 0 : 1 / (Math.pow(l, 5) * Math.expm1(x));
}

// funciones de igualación de color CIE 1931 (ajuste de Wyman, Sloan y Shirley, 2013)
const g3 = (l: number, mu: number, s1: number, s2: number) => { const t = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
export const cieX = (l: number) => 1.056 * g3(l, 599.8, 37.9, 31.0) + 0.362 * g3(l, 442.0, 16.0, 26.7) - 0.065 * g3(l, 501.1, 20.4, 26.2);
export const cieY = (l: number) => 0.821 * g3(l, 568.8, 46.9, 40.5) + 0.286 * g3(l, 530.9, 16.3, 31.1);
export const cieZ = (l: number) => 1.217 * g3(l, 437.0, 11.8, 36.0) + 0.681 * g3(l, 459.0, 26.0, 13.8);

/** XYZ (relativos) de un cuerpo negro a T. */
export function xyzCuerpoNegro(T: number): [number, number, number] {
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 2) { const b = planck(l, T); X += b * cieX(l); Y += b * cieY(l); Z += b * cieZ(l); }
  return [X, Y, Z];
}

/**
 * Color (sRGB LINEAL, máximo 1) y luminancia relativa a 1000 K del cuerpo negro a T.
 * Por debajo de ~800 K (punto de Draper) el brillo visible es despreciable.
 */
export function brilloCuerpoNegro(T: number): { rgb: [number, number, number]; luminancia: number } {
  const [X, Y, Z] = xyzCuerpoNegro(T);
  const Yref = xyzCuerpoNegro(1000)[1];
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
  const mx = Math.max(r, g, b, 1e-300);
  return { rgb: [r / mx, g / mx, b / mx], luminancia: Y / Yref };
}

/** Escarcha (0…1) sobre las piezas frías: aviso visual por debajo de 0 °C. */
export const escarcha = (T: number) => Math.max(0, Math.min(1, (273.15 - T) / 120));

// ───────────────────────────── estelas (dibujo) ─────────────────────────────

/**
 * Fracción t ∈ [0, 1] del segmento cabeza → cabeza − d que queda dentro de la cámara
 * (cilindro de radio rc entre y0 e y1). La cabeza siempre está dentro.
 */
export function fraccionDentro(hx: number, hy: number, hz: number, dx: number, dy: number, dz: number, rc: number, y0: number, y1: number): number {
  let t = 1;
  const ty = hy - dy;
  if (ty < y0 && dy > 0) t = Math.min(t, (hy - y0) / dy);
  if (ty > y1 && dy < 0) t = Math.min(t, (hy - y1) / dy);
  const tx = hx - dx, tz = hz - dz;
  if (tx * tx + tz * tz > rc * rc) {
    // |h − t·d|² = rc² → a t² − 2b t + c = 0, con c = |h|² − rc² ≤ 0: la raíz positiva
    const a = dx * dx + dz * dz, b = hx * dx + hz * dz, c = hx * hx + hz * hz - rc * rc;
    if (a > 1e-12) {
      const disc = b * b - a * c;
      const r = disc > 0 ? (b + Math.sqrt(disc)) / a : 0;
      t = Math.min(t, Math.max(0, r));
    }
  }
  return Math.max(0, t);
}
