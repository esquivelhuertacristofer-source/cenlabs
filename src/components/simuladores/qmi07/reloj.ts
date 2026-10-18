/**
 * qmi07/reloj.ts — EL RELOJ ÚNICO de la titulación (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar). En ese paso:
 *   · la llave deja salir Q = Q₀·área(llave)·√(h/h₀) mL/s (acidobase.ts);
 *   · por debajo del caudal de Weber la punta GOTEA: la gota cuelga y crece hasta el
 *     volumen de Tate y se suelta; por encima sale un CHORRO (paquetes de 0,08 s);
 *   · la gota cae en caída libre hasta la superficie del matraz (altura real del líquido
 *     para el volumen que hay) y, al tocarla, entra en el matraz: nace su ESTELA, que
 *     arrastra disolución con V_e = v·(e^(t/τ) − 1) y cuyo pH se resuelve con el balance
 *     de carga; el matraz pasa a tener esa base (pH exacto) y se apunta la lectura;
 *   · el indicador entra igual, gota a gota, desde su frasco.
 * El dock, la barra de lecturas y la escena leen este mismo objeto (comparan `version`).
 *
 * Dos relojes: el de EXPLORACIÓN (un titulador automático con dosificación dinámica:
 * rápido donde el pH apenas cambia, gota a gota en el salto) y el del RETO (la llave la
 * mueve el alumno y cada gota que sale se apunta en el store con `onSalida`).
 */
import {
  ACIDOS, INDICADORES, V_GOTA_ML, Q_CHORRO, C_ONDA, crearCaudal, tiempoCaida, tauMezcla, volumenArrastrado,
  phZona, pH as phDe, totales, volumenMatraz, volumenEquivalencia, protones, absorbanciaPorCm, fraccionBasica,
  molesGotaIndicador, mVElectrodo, transmitancia, esFuerte,
  type Sistema, type IdIndicador, type RGB, type Totales,
} from './acidobase';
import { buretaAlturaDeLectura, defErlenmeyer } from '../_kit/perfiles';

// ───────────────────────────── geometría que necesita la química ─────────────────────────────

/** Matraz Erlenmeyer de 250 mL del kit (u = 10 cm; origen en el centro de su base). */
export const ERLEN = defErlenmeyer(250);
/**
 * Tabla con interpolación lineal de una función cara de los perfiles (se llena la primera vez).
 * La bureta es cilíndrica entre marcas (lineal exacto) y el Erlenmeyer, un cono suave: con
 * 500 tramos el error queda por debajo de 0,01 mm.
 */
function tabla(f: (x: number) => number, x0: number, x1: number, n: number) {
  let t: Float64Array | null = null;
  return (x: number) => {
    if (!t) { t = new Float64Array(n + 1); for (let i = 0; i <= n; i++) t[i] = f(x0 + ((x1 - x0) * i) / n); }
    const u = Math.max(0, Math.min(n, ((x - x0) / (x1 - x0)) * n));
    const i = Math.min(n - 1, Math.floor(u));
    return t[i] + (t[i + 1] - t[i]) * (u - i);
  };
}

/** Altura de la superficie del líquido (u, local del matraz) para V mL. */
export const ySuperficie = tabla((mL) => ERLEN.alturaParaVolumen(mL), 0, 250, 500);
/** Radio interior (u) a una altura local. */
export const radioInterior = (y: number) => ERLEN.radioInteriorEn(y);
/** Punta de la bureta respecto del matraz (u): 1,2 cm por encima de la boca y algo descentrada. */
export const PUNTA_LOCAL: [number, number, number] = [-0.06, ERLEN.altura + 0.12, 0.03];
/** Boquilla del frasco gotero cuando dosifica (u, local del matraz): sobre la boca, por delante de la punta. */
export const GOTERO_LOCAL: [number, number, number] = [0.02, ERLEN.altura + 0.14, 0.1];

/** Altura de la columna de la bureta sobre la punta (cm) para una lectura. */
export const alturaColumnaCm = tabla((mL) => buretaAlturaDeLectura(mL) * 10, 0, 50, 500);
export const CAUDAL = crearCaudal(alturaColumnaCm);
export const CAPACIDAD_ML = 50;

// ───────────────────────────── tipos ─────────────────────────────

export interface Lectura {
  ph: number;
  mV: number;
  /** fracción básica del indicador (null sin indicador) */
  fIn: number | null;
  /** mol/L de indicador en el matraz */
  cIn: number;
  /** transmitancia por canal de 6 cm de disolución (el color del matraz, para el DOM) */
  T6: RGB;
  /** coeficiente de absorción natural del matraz por canal (1/u) para el sombreador */
  aBulk: RGB;
}

export interface PuntoCurva { v: number; ph: number }

interface GotaCae { y: number; vy: number; x: number; z: number; vol: number; tipo: 'base' | 'indicador'; t: number }
interface Pluma {
  t: number; tipo: 'base' | 'indicador'; vol: number;
  /** totales del matraz justo antes de que entrara (lo que arrastra) */
  antes: Totales;
  /** indicador: moles de la gota */
  nIn: number;
  phi0: number; r0: number;
  /** salida para la escena (u, local del matraz) y Δa por canal (1/u, natural) */
  centro: [number, number, number]; sigma: number; da: RGB; viva: boolean;
}
interface Onda { t: number; x: number; z: number }

export interface Dosis { id: IdIndicador; t: number; n: number; soltadas: number }
/** Calendario del frasco gotero (s): llega, deja caer n gotas cada 0,45 s y vuelve. */
export const GOTERO = { llegada: 1.15, entreGotas: 0.45, vuelta: 1.1 };
export const duracionDosis = (n: number) => GOTERO.llegada + 0.25 + n * GOTERO.entreGotas + 0.5 + GOTERO.vuelta;

/** Estelas a la vez y manchas por estela (lo que admite el sombreador del líquido). */
export const MAX_PLUMAS = 6;
export const MANCHAS = 3;
export const MAX_MANCHAS = MAX_PLUMAS * MANCHAS;

const LN10 = Math.LN10;
/** cm por unidad de escena */
const CM = 10;
const G_U = 98.0665; // g en u/s²

/** Generador determinista (capturas repetibles). */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ───────────────────────────── el reloj ─────────────────────────────

export class RelojTitulacion {
  sistema: Sistema;
  indicador: IdIndicador | null = null;
  /** moles de indicador en el matraz */
  nIn = 0;
  /** lectura de la bureta (mL que han salido) y mL que ya están en el matraz */
  vbSalida = 0;
  vb = 0;
  /** apertura de la llave 0–1 (la que gira el mando) y la que pide el titulador automático */
  apertura = 0;
  aperturaObjetivo = 0;
  auto = false;
  rpm = 400;
  factor = 1;
  pausa = false;
  purgada = true;
  t = 0;
  /** mL colgando de la punta */
  colgando = 0;
  chorro = false;
  Q = 0;
  gotas: GotaCae[] = [];
  plumas: Pluma[] = [];
  ondas: Onda[] = [];
  historia: PuntoCurva[] = [];
  lectura: Lectura;
  dosis: Dosis | null = null;
  /** ángulo de la barra agitadora (rad, real) */
  angBarra = 0;
  version = 0;
  /** sube con cada alícuota nueva (la escena y el dock limpian lo suyo) */
  generacion = 0;
  /** reto: cada mL que SALE de la bureta (gota soltada o paquete de chorro) */
  onSalida?: (mL: number) => void;
  /** titulador automático: segundos de espera tras terminar */
  private espera = -1;
  private paquete = 0;
  private tPaquete = 0;
  private rnd = azar(7071);
  /** salida para el sombreador del líquido */
  manchas = { centros: new Float32Array(MAX_MANCHAS * 4), da: new Float32Array(MAX_MANCHAS * 3), n: 0 };

  constructor(sistema: Sistema, opciones: { auto?: boolean; indicador?: IdIndicador | null; conIndicador?: boolean } = {}) {
    this.sistema = { ...sistema };
    this.auto = !!opciones.auto;
    this.indicador = opciones.indicador ?? null;
    if (this.indicador && opciones.conIndicador) this.nIn = molesGotaIndicador(INDICADORES[this.indicador]) * INDICADORES[this.indicador].gotas;
    this.lectura = this.leer();
    this.anotar(true);
  }

  /** Volumen del matraz ahora (mL). */
  get volumen() { return volumenMatraz(this.sistema, this.vb); }
  /** Altura local de la superficie del líquido (u). */
  get ySup() { return ySuperficie(this.volumen); }
  /** Último punto de equivalencia que cabe en la bureta (mL). */
  get vEqUltimo() {
    let v = volumenEquivalencia(this.sistema);
    for (let j = 2; j <= protones(this.sistema.acido); j++) { const w = volumenEquivalencia(this.sistema, j); if (w <= CAPACIDAD_ML - 2 && (ACIDOS[this.sistema.acido].pKa[j - 1] ?? 0) < 11) v = w; }
    return v;
  }

  private leer(): Lectura {
    const c = totales(this.sistema, this.vb);
    const ph = phDe(this.sistema.acido, c);
    const V = this.volumen;
    const ind = this.indicador ? INDICADORES[this.indicador] : null;
    const cIn = ind ? this.nIn / (V * 1e-3) : 0;
    const A = ind ? absorbanciaPorCm(ind, cIn, ph) : ([0, 0, 0] as RGB);
    return {
      ph, mV: mVElectrodo(ph), fIn: ind ? fraccionBasica(ind, ph) : null, cIn,
      T6: ind ? transmitancia(ind, cIn, ph, 6) : [1, 1, 1],
      aBulk: A.map((x) => x * LN10 * CM) as RGB,
    };
  }

  private anotar(forzar = false) {
    const p = { v: this.vb, ph: this.lectura.ph };
    const u = this.historia[this.historia.length - 1];
    if (!forzar && u && Math.abs(p.v - u.v) < 1e-9) { u.ph = p.ph; return; }
    this.historia.push(p);
    if (this.historia.length > 2400) {
      const viejos = this.historia.slice(0, 1200).filter((_, i) => i % 2 === 0);
      this.historia = [...viejos, ...this.historia.slice(1200)];
    }
  }

  /** Alícuota nueva: matraz con el ácido y el agua, bureta llena, sin indicador. */
  reiniciar(sistema?: Partial<Sistema>, indicador: IdIndicador | null = this.indicador) {
    if (sistema) this.sistema = { ...this.sistema, ...sistema };
    this.indicador = indicador;
    this.nIn = 0;
    this.vb = 0; this.vbSalida = 0; this.colgando = 0; this.chorro = false; this.Q = 0;
    this.gotas = []; this.plumas = []; this.ondas = []; this.historia = [];
    this.dosis = null; this.espera = -1; this.paquete = 0; this.tPaquete = 0;
    this.apertura = 0; this.aperturaObjetivo = 0;
    this.generacion++;
    this.lectura = this.leer();
    this.anotar(true);
    this.version++;
  }

  /**
   * Titulación ya empezada (el estado de entrada de la exploración): la bureta marca `v` mL
   * y las lecturas anteriores son las del matraz a cada volumen (mismo balance de carga),
   * cada 0,1 mL como las apuntaría el titulador en la zona plana.
   */
  adelantarA(v: number) {
    const vb = Math.max(0, Math.min(CAPACIDAD_ML - 1, Math.round(v * 1000) / 1000));
    this.vb = vb; this.vbSalida = vb; this.colgando = 0; this.gotas = []; this.plumas = [];
    this.historia = [];
    const n = Math.max(1, Math.round(vb / 0.1));
    for (let i = 0; i <= n; i++) {
      const x = (vb * i) / n;
      this.historia.push({ v: x, ph: phDe(this.sistema.acido, totales(this.sistema, x)) });
    }
    this.lectura = this.leer();
    this.version++;
  }

  /** Empieza a echar el indicador con el frasco gotero (las gotas entran con la química). */
  dosificar(id: IdIndicador) {
    if (this.indicador && this.indicador !== id) this.nIn = 0;
    this.indicador = id;
    this.dosis = { id, t: 0, n: INDICADORES[id].gotas, soltadas: 0 };
    this.version++;
  }

  /** Sincroniza la lectura con el store (reto): si no cuadra, se da por alícuota nueva. */
  sincronizar(lecturaStore: number) {
    if (Math.abs(lecturaStore - this.vbSalida) < 0.0015) return;
    if (lecturaStore === 0) { this.reiniciar(); return; }
    this.vbSalida = lecturaStore; this.vb = lecturaStore; this.colgando = 0; this.gotas = []; this.plumas = [];
    this.lectura = this.leer(); this.anotar(); this.version++;
  }

  /** Avanza dtReal segundos de pantalla (con el factor de cámara rápida). */
  paso(dtReal: number) {
    if (this.pausa || !(dtReal > 0)) return;
    let resto = Math.min(dtReal, 0.1) * this.factor;
    while (resto > 1e-9) {
      const h = Math.min(resto, 0.02);
      this.integrar(h);
      resto -= h;
    }
    this.publicarManchas();
    this.version++;
  }

  private salir(mL: number) {
    const d = Math.round(mL * 1000) / 1000;
    if (d <= 0) return 0;
    const lleno = Math.min(d, Math.round((CAPACIDAD_ML - this.vbSalida) * 1000) / 1000);
    if (lleno <= 0) return 0;
    this.vbSalida = Math.round((this.vbSalida + lleno) * 1000) / 1000;
    this.onSalida?.(lleno);
    return lleno;
  }

  private integrar(dt: number) {
    this.t += dt;
    this.angBarra += (this.rpm / 60) * 2 * Math.PI * dt;
    // ── indicador desde su frasco ──
    const D = this.dosis;
    if (D) {
      D.t += dt;
      const tGota = (k: number) => GOTERO.llegada + 0.25 + k * GOTERO.entreGotas;
      while (D.soltadas < D.n && D.t >= tGota(D.soltadas)) {
        const [x, y, z] = GOTERO_LOCAL;
        this.gotas.push({ x, y, z, vy: 0, vol: INDICADORES[D.id].mlGota, tipo: 'indicador', t: 0 });
        D.soltadas++;
      }
      if (D.t >= duracionDosis(D.n)) this.dosis = null;
    }
    // ── titulador automático ──
    if (this.auto) this.programa(dt);
    // la llave gira hacia su objetivo (mando: ~1,2 vueltas de escala por segundo)
    const dA = this.aperturaObjetivo - this.apertura;
    this.apertura += Math.sign(dA) * Math.min(Math.abs(dA), dt * 1.2);
    // ── la bureta ──
    this.Q = CAUDAL.caudal(this.apertura, this.vbSalida);
    const chorro = this.Q > Q_CHORRO;
    if (chorro !== this.chorro) { this.chorro = chorro; if (chorro) { this.colgando = 0; } }
    const [px, py, pz] = PUNTA_LOCAL;
    if (this.chorro) {
      // paquetes de 0,08 s que bajan con la velocidad del chorro y entran en el matraz
      this.paquete += this.Q * dt;
      this.tPaquete += dt;
      if (this.tPaquete >= 0.08) {
        const v = this.salir(this.paquete);
        if (v > 0) this.gotas.push({ x: px, y: py - 0.02, z: pz, vy: -Math.max(0.5, this.Q * 1e-6 / (Math.PI * 2.5e-7)) * 10, vol: v, tipo: 'base', t: 0 });
        this.paquete = 0; this.tPaquete = 0;
      }
    } else if (this.Q > 0 && this.vbSalida < CAPACIDAD_ML) {
      this.colgando += this.Q * dt;
      if (this.colgando >= V_GOTA_ML) {
        const v = this.salir(V_GOTA_ML);
        this.colgando -= V_GOTA_ML;
        if (v > 0) this.gotas.push({ x: px, y: py - 0.02, z: pz, vy: 0, vol: v, tipo: 'base', t: 0 });
      }
    }
    // ── caída libre de gotas y paquetes ──
    const ys = this.ySup;
    for (const g of this.gotas) {
      g.t += dt;
      g.vy -= G_U * dt;
      g.y += g.vy * dt;
    }
    const llegan = this.gotas.filter((g) => g.y <= ys);
    if (llegan.length) {
      this.gotas = this.gotas.filter((g) => g.y > ys);
      for (const g of llegan) this.entra(g);
    }
    // ── estelas ──
    const tau = tauMezcla(this.rpm);
    const V = this.volumen;
    for (const p of this.plumas) {
      p.t += dt;
      const vE = volumenArrastrado(p.vol, p.t, tau);
      if (p.vol + vE >= V) p.viva = false;
      if (p.t > 14) p.viva = false;
    }
    this.plumas = this.plumas.filter((p) => p.viva);
    // ── ondas ──
    for (const o of this.ondas) o.t += dt;
    this.ondas = this.ondas.filter((o) => o.t < 0.5);
  }

  /** Una gota (o un paquete) toca la superficie: entra en el matraz. */
  private entra(g: GotaCae) {
    const antes = totales(this.sistema, this.vb);
    const ang = Math.atan2(g.z, g.x), r = Math.hypot(g.x, g.z);
    this.ondas.push({ t: 0, x: g.x, z: g.z });
    if (this.ondas.length > 8) this.ondas.shift();
    let nIn = 0;
    if (g.tipo === 'base') {
      this.vb = Math.round((this.vb + g.vol) * 1000) / 1000;
    } else if (this.indicador) {
      nIn = molesGotaIndicador(INDICADORES[this.indicador]);
      this.nIn += nIn;
    }
    this.lectura = this.leer();
    if (g.tipo === 'base') this.anotar();
    // sin sitio para otra estela (goteo rápido): la gota cae en la zona de la estela más joven
    // y la alimenta. Su volumen arrastrado se conserva: edad efectiva t' = τ·ln(1 + V_e/v').
    if (this.plumas.length >= MAX_PLUMAS) {
      let q: Pluma | null = null;
      for (let i = this.plumas.length - 1; i >= 0 && !q; i--) if (this.plumas[i].tipo === g.tipo) q = this.plumas[i];
      if (q) {
        const tau = tauMezcla(this.rpm);
        const vE = volumenArrastrado(q.vol, q.t, tau);
        q.vol += g.vol;
        q.nIn += nIn;
        q.t = tau * Math.log1p(vE / q.vol);
        return;
      }
    }
    const p: Pluma = {
      t: 0, tipo: g.tipo, vol: g.vol, antes, nIn, phi0: ang + (this.rnd() - 0.5) * 0.3, r0: r,
      centro: [0, 0, 0], sigma: 0, da: [0, 0, 0], viva: true,
    };
    this.plumas.push(p);
    if (this.plumas.length > MAX_PLUMAS) this.plumas.shift();
  }

  /**
   * Titulador automático (dosificación dinámica, como un titulador potenciométrico): el
   * caudal objetivo es 0,1/(ΔpH/ΔV) mL/s entre 0,04 (una gota por segundo) y el máximo
   * sin chorro; al pasar el último equivalente + 7 mL cierra, espera y prepara otra alícuota.
   */
  private programa(dt: number) {
    if (this.dosis) { this.aperturaObjetivo = 0; return; }
    if (this.espera >= 0) {
      this.espera += dt;
      this.aperturaObjetivo = 0;
      if (this.espera > 4.5 && this.gotas.length === 0) {
        const ind = this.indicador;
        this.reiniciar();
        if (ind) this.dosificar(ind);
      }
      return;
    }
    const vFin = Math.min(CAPACIDAD_ML - 1, this.vEqUltimo + 7);
    if (this.vbSalida >= vFin) { this.espera = 0; this.aperturaObjetivo = 0; return; }
    const pend = this.pendienteReciente();
    const qMax = Q_CHORRO * 0.82;
    const q = Math.max(0.04, Math.min(qMax, 0.1 / Math.max(1e-6, pend)));
    this.aperturaObjetivo = CAUDAL.aperturaPara(q, this.vbSalida);
  }

  /** |ΔpH/ΔV| de las últimas lecturas (≥ 0,12 mL atrás); también mira hacia delante una gota. */
  pendienteReciente(): number {
    const h = this.historia;
    if (h.length < 2) return 0.05;
    const u = h[h.length - 1];
    let k = h.length - 2;
    while (k > 0 && u.v - h[k].v < 0.12) k--;
    const atras = Math.abs((u.ph - h[k].ph) / Math.max(1e-6, u.v - h[k].v));
    // el titulador «anticipa» con la gota siguiente (lo que hace un titulador real con su predicción)
    const adelante = Math.abs(phDe(this.sistema.acido, totales(this.sistema, this.vb + V_GOTA_ML * 3)) - u.ph) / (V_GOTA_ML * 3);
    return Math.max(atras, adelante);
  }

  /** Geometría y color de cada estela para el sombreador del líquido. */
  private publicarManchas() {
    const M = this.manchas;
    M.centros.fill(0); M.da.fill(0);
    let n = 0;
    const ind = this.indicador ? INDICADORES[this.indicador] : null;
    if (!ind) { M.n = 0; return; }
    const tau = tauMezcla(this.rpm);
    const ys = this.ySup, y0 = ERLEN.y0;
    const prof = ys - y0;
    const omega = 0.15 * (this.rpm / 60) * 2 * Math.PI;
    const aB = this.lectura.aBulk;
    const cBulk = this.lectura.cIn;
    for (const p of this.plumas) {
      const vE = volumenArrastrado(p.vol, p.t, tau);
      const vZ = p.vol + vE;
      // absorbancia de la zona (química de la zona) menos la del matraz → Δa
      let a: RGB;
      if (p.tipo === 'base') {
        const phZ = phZona(this.sistema.acido, p.antes, this.sistema.cb, p.vol, vE);
        const cZ = cBulk * vE / vZ; // la gota de sosa no trae indicador
        a = absorbanciaPorCm(ind, cZ, phZ).map((x) => x * LN10 * CM) as RGB;
      } else {
        const cZ = (p.nIn + cBulk * vE * 1e-3) / (vZ * 1e-3);
        a = absorbanciaPorCm(ind, cZ, this.lectura.ph).map((x) => x * LN10 * CM) as RGB;
      }
      const da: RGB = [a[0] - aB[0], a[1] - aB[1], a[2] - aB[2]];
      // geometría: la estela baja hacia la mitad del líquido, se abre hacia la pared y gira con él
      const yC = ys - prof * (0.12 + 0.42 * (1 - Math.exp(-p.t / 0.45)));
      const rMax = radioInterior(Math.max(y0 + 0.001, yC)) * 0.58;
      const rC = p.r0 + (rMax - p.r0) * (1 - Math.exp(-p.t / 0.6));
      const sig = Math.cbrt((vZ / MANCHAS) * 1e-3 / (2 * Math.PI) ** 1.5);
      const sigma = Math.min(sig, 0.5 * prof + 0.004);
      const abre = Math.min(1.1, 0.12 + 0.5 * p.t);
      for (let k = 0; k < MANCHAS && n < MAX_MANCHAS; k++) {
        const phi = p.phi0 + omega * p.t + (k - (MANCHAS - 1) / 2) * abre * 0.6;
        const rk = rC * (1 + (k - 1) * 0.08 * Math.min(1, p.t));
        M.centros[n * 4] = Math.cos(phi) * rk;
        M.centros[n * 4 + 1] = yC + (k - 1) * Math.min(prof * 0.12, sigma * 0.4);
        M.centros[n * 4 + 2] = Math.sin(phi) * rk;
        M.centros[n * 4 + 3] = sigma;
        M.da[n * 3] = da[0]; M.da[n * 3 + 1] = da[1]; M.da[n * 3 + 2] = da[2];
        n++;
      }
      p.centro = [Math.cos(p.phi0 + omega * p.t) * rC, yC, Math.sin(p.phi0 + omega * p.t) * rC];
      p.sigma = sigma; p.da = da;
      // ya no se distingue: el color de la zona es el del matraz (≤ 0,4 % de absorbancia en su centro)
      const contraste = Math.max(Math.abs(da[0]), Math.abs(da[1]), Math.abs(da[2])) * sigma * Math.sqrt(2 * Math.PI);
      if (p.t > 0.25 && contraste < 0.004) p.viva = false;
    }
    M.n = n;
  }

  /** Lo que mide la gráfica: ¿qué gotas por segundo salen? */
  get gotasPorSegundo() { return this.chorro ? Infinity : this.Q / V_GOTA_ML; }
  /** Velocidad de las ondas de la gota (u/s). */
  static readonly C_ONDA_U = C_ONDA * 10;
  /** Caída libre desde la punta hasta la superficie (s). */
  get tiempoCaida() { return tiempoCaida((PUNTA_LOCAL[1] - this.ySup) * CM); }
  get fuerte() { return esFuerte(this.sistema.acido); }
}

/** Sistema de la exploración (ácido conocido) y el del reto (HCl desconocido del store). */
export const CONCENTRACION_EXPLORACION: Record<Sistema['acido'], number> = { HCl: 0.1, CH3COOH: 0.1, H3PO4: 0.05 };
