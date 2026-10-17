/**
 * qmi02/reloj.ts — EL RELOJ ÚNICO de la cámara de gas (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtPantalla)` una vez por cuadro (useFrame de prioridad −1,
 * antes de dibujar). En ese cuadro:
 *   · el pistón avanza hacia el volumen fijado A TIEMPO REAL (es el instrumento: un
 *     husillo que se gira en segundos);
 *   · las moléculas avanzan dtPantalla × factor segundos REALES (cámara lenta rotulada);
 *   · se cuentan los impulsos sobre las paredes y se publica la lectura de ESE cuadro.
 * El dock, la barra de lecturas, las agujas y las esferas leen este mismo objeto
 * (comparando `version`), así que escena, gráficas y cifras salen del mismo estado.
 *
 * El estado «macro» (T, V, n, gas) es el del store: lo que fija el alumno y lo que
 * juzga el validador (P = nRT/V). La muestra cinética lo sigue con su física.
 */
import {
  GasCinetico, CAMARA, alturaGas, volumenDeAltura, presionLey, masaMolar, vProbable, vRms, ATM_PA, R_ATM,
  type IdGas, type OpcionesGas,
} from './cinetica';

/** Factores de cámara lenta (s reales por s de pantalla): ×1/2000, ×1/5000, ×1/20000. */
export const FACTORES = [5e-4, 2e-4, 5e-5] as const;
export type Factor = (typeof FACTORES)[number];

export interface EstadoMacro { T: number; V: number; n: number; gas: IdGas; explotado: boolean }

/** Un estado por el que pasó el alumno (la trayectoria del diagrama). */
export interface PuntoTrayectoria { T: number; V: number; n: number; P: number }

export interface Lectura {
  /** lo que marca el manómetro (atm): nRT/V con el volumen que tiene el pistón; 1 atm sin pistón */
  P: number;
  /** nRT/V del estado fijado (atm): la ley */
  Pley: number;
  /** presión medida contando impulsos en las paredes (atm), media desde que el gas se asentó */
  Pimp: number | null;
  /** error estándar de Pimp (atm), por medias de lotes */
  sigma: number | null;
  /** choques con las paredes contados en la medida */
  choques: number;
  /** temperatura cinética de la muestra, M⟨v²⟩/(3R), suavizada (K) */
  Tmuestra: number;
  /** esferas en la cámara */
  N: number;
  /** volumen que tiene el pistón ahora (L) */
  V: number;
  /** el gas se está asentando tras un cambio: aún no se mide */
  asentando: boolean;
}

export const N_BINS = 28;
/** Fondos de escala del histograma de rapideces (m/s). */
export const EJES_V = [400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000];
/** Fondo de escala para T y M: el menor que deja ver 3,1·v_p. */
export const ejeRapidez = (T: number, M: number) => EJES_V.find((e) => e >= 3.1 * vProbable(T, M)) ?? EJES_V[EJES_V.length - 1];

const MAX_TRAYECTORIA = 400;
/** Diámetro de la cámara en metros: la escala de tiempos de la muestra. */
const DIAM_M = (2 * CAMARA.R) / 10;

/** Generaciones ÚNICAS: la escena repuebla sus esferas al cambiar de generación. */
let GENERACIONES = 0;

export class RelojGas {
  sim: GasCinetico;
  macro: EstadoMacro;
  factor: Factor = 2e-4;
  pausa = false;
  /** sin animaciones (prefers-reduced-motion): el pistón salta */
  reducido = false;
  version = 0;
  generacion = ++GENERACIONES;
  /** segundos REALES que han vivido las moléculas */
  tiempoReal = 0;
  /** altura del plano del pistón (u) que se ve ahora */
  yPiston: number;
  yObjetivo: number;
  lectura: Lectura;
  trayectoria: PuntoTrayectoria[] = [];
  /** histograma de rapideces (cuentas suavizadas por bin) y su fondo de escala */
  hist = new Float64Array(N_BINS);
  ejeV: number;
  /** tiempo de pantalla desde el último cambio (para el aviso «asentando») */
  private medida = { pdt: 0, t: 0, choques: 0, lotes: [] as number[], lotePdt: 0, loteT: 0, espera: 0 };
  private cola = 0;
  private tMuestra: number;
  private opciones: OpcionesGas;

  constructor(m: EstadoMacro, opciones: OpcionesGas = {}) {
    this.opciones = opciones;
    this.macro = { ...m };
    this.sim = new GasCinetico(m, opciones);
    this.yPiston = this.yObjetivo = CAMARA.yFondo + alturaGas(m.V);
    this.ejeV = ejeRapidez(m.T, masaMolar(m.gas));
    this.tMuestra = m.T;
    this.medida.espera = this.asiento();
    this.lectura = this.leer(true);
    this.anotar(true);
    this.contarHistograma(1);
  }

  /** Lote de medida (s reales): 1,5 cruces de la cámara a v_rms. */
  private lote() { return (1.5 * DIAM_M) / vRms(this.macro.T, masaMolar(this.macro.gas)); }
  /** Asiento tras un cambio (s reales): 2 cruces. */
  private asiento() { return (2 * DIAM_M) / vRms(this.macro.T, masaMolar(this.macro.gas)); }

  private reiniciarMedida() {
    const m = this.medida;
    m.pdt = 0; m.t = 0; m.choques = 0; m.lotes = []; m.lotePdt = 0; m.loteT = 0; m.espera = this.asiento();
  }

  /** Volumen (L) que tiene el pistón en este cuadro. */
  volumenActual() { return volumenDeAltura(this.yPiston - CAMARA.yFondo); }

  private leer(asentando: boolean): Lectura {
    const m = this.medida, M = this.macro;
    const V = this.volumenActual();
    const P = M.explotado ? 1 : presionLey(this.sim.n, M.T, V);
    let Pimp: number | null = null, sigma: number | null = null;
    // la primera cifra sale con el primer lote; el error, desde el tercero
    if (!M.explotado && m.t > 0 && m.lotes.length >= 1) {
      Pimp = m.pdt / m.t / ATM_PA;
      if (m.lotes.length >= 3) {
        const k = m.lotes.length, media = m.lotes.reduce((s, x) => s + x, 0) / k;
        const sd = Math.sqrt(m.lotes.reduce((s, x) => s + (x - media) ** 2, 0) / (k - 1));
        sigma = sd / Math.sqrt(k) / ATM_PA;
      }
    }
    return {
      P, Pley: presionLey(M.n, M.T, M.V), Pimp, sigma, choques: m.choques, Tmuestra: this.tMuestra,
      N: this.sim.N, V, asentando: asentando && !M.explotado,
    };
  }

  /** R que sale de la muestra: Pimp·V/(nT) en atm·L/(mol·K), con su error. */
  rEmergente(): { R: number; sigma: number | null } | null {
    const l = this.lectura;
    if (l.Pimp == null) return null;
    const k = this.lectura.V / (this.sim.n * this.macro.T);
    return { R: l.Pimp * k, sigma: l.sigma == null ? null : l.sigma * k };
  }

  private anotar(forzar = false) {
    const M = this.macro;
    const u = this.trayectoria[this.trayectoria.length - 1];
    if (!forzar && u && u.T === M.T && u.V === M.V && u.n === M.n) return;
    if (M.explotado) return;
    this.trayectoria.push({ T: M.T, V: M.V, n: M.n, P: presionLey(M.n, M.T, M.V) });
    if (this.trayectoria.length > MAX_TRAYECTORIA) this.trayectoria.splice(0, this.trayectoria.length - MAX_TRAYECTORIA);
  }

  /** Cuenta las rapideces de la muestra en el histograma, con peso `a` (EMA). */
  private contarHistograma(a: number) {
    const s = this.sim, eje = this.ejeV, h = this.hist;
    const dv = eje / N_BINS;
    for (let k = 0; k < N_BINS; k++) h[k] *= 1 - a;
    for (let i = 0; i < s.N; i++) {
      const v = Math.sqrt(s.vx[i] ** 2 + s.vy[i] ** 2 + s.vz[i] ** 2);
      const k = Math.floor(v / dv);
      if (k < N_BINS) h[k] += a;
    }
  }

  /** Densidad de probabilidad del histograma (por m/s) en cada bin. */
  densidad(): Float64Array {
    const out = new Float64Array(N_BINS);
    const dv = this.ejeV / N_BINS;
    let tot = 0;
    for (let k = 0; k < N_BINS; k++) tot += this.hist[k];
    // las que se salen del eje también cuentan en el total (normalización honesta)
    const fuera = Math.max(0, this.sim.N - tot);
    const total = tot + fuera;
    if (total > 0) for (let k = 0; k < N_BINS; k++) out[k] = this.hist[k] / (total * dv);
    return out;
  }

  /** Avanza el reloj dtPantalla segundos de pantalla. Devuelve true si algo cambió. */
  paso(dtPantalla: number): boolean {
    if (this.pausa || !(dtPantalla > 0)) return false;
    const dt = Math.min(dtPantalla, 0.1);
    const M = this.macro;
    // ─ el pistón: tiempo real ─
    let moviendo = false;
    const dy = this.yObjetivo - this.yPiston;
    if (Math.abs(dy) > 1e-6 && !M.explotado) {
      this.yPiston = this.reducido || Math.abs(dy) < 2e-4 ? this.yObjetivo : this.yPiston + dy * (1 - Math.exp(-dt * 7));
      this.sim.moverPiston(this.yPiston);
      moviendo = true;
    }
    // ─ la válvula deja pasar las esferas nuevas en unos cuadros ─
    if (this.cola > 0) {
      const k = Math.min(this.cola, 2);
      this.sim.inyectar(k, this.sim.n + ((M.n - this.sim.n) * k) / this.cola);
      this.cola -= k;
      if (this.cola === 0) this.sim.n = M.n;
      moviendo = true;
    }
    // ─ las moléculas: cámara lenta ─
    this.sim.paso(dt * this.factor);
    const c = this.sim.tomarContadores();
    this.tiempoReal += c.t;
    // ─ la medida por impulsos ─
    const m = this.medida;
    if (moviendo || M.explotado) this.reiniciarMedida();
    else if (m.espera > 0) m.espera -= c.t;
    else {
      m.pdt += c.pdt; m.t += c.t; m.choques += c.choquesPared;
      m.lotePdt += c.pdt; m.loteT += c.t;
      if (m.loteT >= this.lote()) { m.lotes.push(m.lotePdt / m.loteT); m.lotePdt = 0; m.loteT = 0; }
    }
    // ─ histograma y temperatura de la muestra (suavizados en tiempo de pantalla) ─
    this.contarHistograma(1 - Math.exp(-dt / 0.6));
    if (this.sim.N > 0) this.tMuestra += (this.sim.temperaturaMuestra() - this.tMuestra) * (1 - Math.exp(-dt / 2));
    this.lectura = this.leer(moviendo || m.espera > 0 || m.lotes.length < 1);
    this.version++;
    return true;
  }

  /** El alumno cambió el estado (store). */
  fijar(nuevo: EstadoMacro) {
    const a = this.macro;
    if (a.T === nuevo.T && a.V === nuevo.V && a.n === nuevo.n && a.gas === nuevo.gas && a.explotado === nuevo.explotado) return;
    // reinicio de la cámara (tras explotar, o al bajar los moles: sólo lo hace «Reiniciar»)
    if ((a.explotado && !nuevo.explotado) || nuevo.n < a.n - 1e-9) { this.reiniciar(nuevo); return; }
    this.macro = { ...nuevo };
    if (nuevo.gas !== a.gas) this.sim.cambiarGas(nuevo.gas);
    if (nuevo.T !== a.T) this.sim.fijarTemperatura(nuevo.T);
    if (nuevo.n > a.n + 1e-9) {
      // las esferas que faltan entran por la válvula
      const faltan = this.sim.esferasDe(nuevo.n) - this.sim.N - this.cola;
      if (faltan > 0) this.cola += faltan; else this.sim.n = nuevo.n;
    }
    this.yObjetivo = CAMARA.yFondo + alturaGas(nuevo.V);
    if (nuevo.explotado && !a.explotado) this.sim.abrir();
    if (this.pausa) {
      // en pausa sólo se congelan las moléculas: el pistón y las cifras siguen al control
      this.yPiston = this.yObjetivo;
      this.sim.moverPiston(this.yPiston);
      if (this.cola > 0) { this.sim.inyectar(this.cola, nuevo.n); this.cola = 0; }
    }
    const eje = ejeRapidez(nuevo.T, masaMolar(nuevo.gas));
    if (eje !== this.ejeV || nuevo.gas !== a.gas) { this.ejeV = eje; this.hist.fill(0); this.contarHistograma(1); }
    this.reiniciarMedida();
    this.anotar();
    this.lectura = this.leer(true);
    this.version++;
  }

  /** Cámara nueva: esferas repartidas de nuevo y trayectoria vacía. */
  reiniciar(m: EstadoMacro) {
    this.macro = { ...m };
    this.sim = new GasCinetico(m, { ...this.opciones, semilla: (this.opciones.semilla ?? 2024) + GENERACIONES });
    this.yPiston = this.yObjetivo = CAMARA.yFondo + alturaGas(m.V);
    this.cola = 0;
    this.trayectoria = [];
    this.ejeV = ejeRapidez(m.T, masaMolar(m.gas));
    this.hist.fill(0);
    this.contarHistograma(1);
    this.tMuestra = m.T;
    this.generacion = ++GENERACIONES;
    this.reiniciarMedida();
    this.anotar(true);
    this.lectura = this.leer(true);
    this.version++;
  }
}

/** R de la ley, en las unidades del lab. */
export const R_LEY = R_ATM;
