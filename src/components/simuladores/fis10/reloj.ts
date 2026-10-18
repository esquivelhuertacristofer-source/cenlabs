/**
 * fis10/reloj.ts — EL RELOJ ÚNICO del motor (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar): el tiempo de modelo avanza dtReal·factor (cámara lenta rotulada con su factor
 * real), se integra J·dω/dt = τ(θ) − τ_freno en subpasos de ≤ 0,1 ms y se publica el
 * estado de ESE cuadro. El rotor 3D, las fuerzas, la corriente en las cabezas de bobina,
 * el tacómetro, el dock (τ(θ) y ω(t)) y las cifras leen este mismo objeto.
 *
 * Cámara lenta automática: el inducido se ve girar a ≤ 2,4 vueltas por segundo de pantalla.
 * El factor sale de la velocidad mayor entre la actual y la de régimen, y se rotula siempre.
 *
 * Tacómetro óptico: una cinta reflectante en el acople; cada vez que pasa frente al sensor
 * (θ múltiplo de 2π) da un pulso y la lectura es 60/T entre pulsos, como el de verdad.
 */
import {
  paso as pasoMotor, configImanes, corriente, estadoInicial, regimen, aRpm, bobinaActiva, fcemMedia,
  type ConfigImanes, type EstadoDin, type ParamsMotor, type Regimen,
} from './motor';
import { kMotor, rArmadura } from '@/domain/fisica';

/** Factores de cámara lenta (s de modelo por s de pantalla). */
export const LENTOS = [1, 1 / 2, 1 / 5, 1 / 10, 1 / 20, 1 / 50, 1 / 100] as const;
/** Vueltas por segundo de pantalla a las que se quiere ver el inducido, como mucho. */
export const VUELTAS_VISIBLES = 2.4;
/** Segundos de pantalla que abarca la gráfica ω(t). */
export const SEGUNDOS_GRAFICA = 12;
/** Subpaso máximo de integración (s de modelo). */
export const H_MAX = 1e-4;

/** El factor mayor (menos lento) que deja ver `rps` vueltas/s a ≤ VUELTAS_VISIBLES. */
export function factorAuto(rps: number): number {
  for (const f of LENTOS) if (Math.abs(rps) * f <= VUELTAS_VISIBLES) return f;
  return LENTOS[LENTOS.length - 1];
}

/** «×1/10» o «×1». */
export const rotuloFactor = (f: number) => (f >= 1 ? '×1' : `×1/${Math.round(1 / f)}`);

export interface Lectura {
  /** rpm del tacómetro (con signo: + horario); 0 si no llegan pulsos */
  nTacho: number;
  /** ω instantánea (rad/s) */
  omega: number;
  /** corriente de la fuente (A, media) */
  I: number;
  /** f.c.e.m. media (V) */
  E: number;
  /** potencias (W): eléctrica, Joule, la que pasa al rotor (E·I) y la que absorbe el freno */
  Pel: number; Pjoule: number; Pint: number; Pfreno: number;
  /** rendimiento de conversión E·I/(V·I) = E/V (null sin potencia de entrada); en régimen = P_freno/P_el */
  eta: number | null;
  /** par motor instantáneo y del freno (N·m) */
  tau: number; tauFreno: number;
}

const CAP = 1600;

export class RelojMotor {
  p: ParamsMotor;
  c: ConfigImanes;
  e: EstadoDin;
  reg: Regimen;
  factor = 1 / 10;
  /** s de modelo que abarca ω(t) */
  ventana = 1.2;
  pausa = false;
  /** sube con cada cuadro integrado o cambio de parámetros */
  version = 0;
  /** historia ω(t) e I(t) (anillo) */
  readonly ht = new Float64Array(CAP);
  readonly hw = new Float32Array(CAP);
  readonly hI = new Float32Array(CAP);
  hn = 0;
  hi = 0;
  private tUltimaMuestra = -Infinity;
  /** tacómetro */
  tacho = { rpm: 0, tPulso: -Infinity, periodo: Infinity, pulsos: 0 };
  /** conmutador: bobina alimentada y último cambio (t de modelo) */
  bobina: 0 | 1 = 0;
  tConmuta = -Infinity;
  conmutaciones = 0;
  private subs = new Set<() => void>();

  constructor(p: ParamsMotor, theta0 = 0.35) {
    this.p = { ...p };
    this.c = configImanes(p.izq, p.der);
    this.reg = regimen(p);
    this.e = estadoInicial(theta0);
    this.bobina = bobinaActiva(theta0).bobina;
    this.elegirFactor(true);
  }

  suscribir(f: () => void): () => void { this.subs.add(f); return () => { this.subs.delete(f); }; }
  private avisar() { this.version++; this.subs.forEach((f) => f()); }

  /** Elige la cámara lenta: con `regimen`, también fija la ventana de ω(t). */
  private elegirFactor(conVentana: boolean) {
    const rpsReg = this.p.energizado && this.reg.arranca ? Math.abs(this.reg.rpm) / 60 : 0;
    const rpsAhora = Math.abs(this.e.omega) / (2 * Math.PI);
    const f = factorAuto(Math.max(rpsReg, rpsAhora));
    // histéresis: sólo se acelera la cámara si con el factor nuevo sigue holgado
    if (f < this.factor || Math.max(rpsReg, rpsAhora) * f <= VUELTAS_VISIBLES * 0.85) this.factor = f;
    if (conVentana) {
      const fv = rpsReg > 0 ? factorAuto(rpsReg) : this.factor;
      this.ventana = Math.max(0.12, SEGUNDOS_GRAFICA * fv);
    }
  }

  /** Cambia mandos (imanes, espiras, fuente, freno, interruptor). */
  fijar(cambios: Partial<ParamsMotor>) {
    const nuevo = { ...this.p, ...cambios };
    const igual = (Object.keys(nuevo) as (keyof ParamsMotor)[]).every((k) => nuevo[k] === this.p[k]);
    if (igual) return;
    this.p = nuevo;
    this.c = configImanes(nuevo.izq, nuevo.der);
    this.reg = regimen(nuevo);
    this.elegirFactor(true);
    this.avisar();
  }

  /** Lleva el motor a su régimen (si arranca) y rellena ω(t) con la ventana anterior. */
  arrancarEnRegimen() {
    const theta = this.e.theta;
    this.e = estadoInicial(theta);
    this.hn = 0; this.hi = 0; this.tUltimaMuestra = -Infinity;
    this.tacho = { rpm: 0, tPulso: -Infinity, periodo: Infinity, pulsos: 0 };
    if (this.p.energizado && this.reg.arranca) {
      this.e.omega = this.reg.omega;
      this.e.quieto = false;
    }
    this.elegirFactor(true);
    // la historia de antes: el mismo modelo, integrado la ventana entera
    this.integrar(this.ventana);
    this.avisar();
  }

  /** Avanza dtReal segundos de pantalla. */
  paso(dtReal: number) {
    if (this.pausa || !(dtReal > 0)) return;
    this.integrar(Math.min(dtReal, 0.1) * this.factor);
    this.elegirFactor(false);
    this.avisar();
  }

  /** Integra `dt` s de modelo con tacómetro, conmutación e historia. */
  integrar(dt: number) {
    if (!(dt > 0)) return;
    const n = Math.max(1, Math.ceil(dt / H_MAX));
    const h = dt / n;
    const dtHist = this.ventana / 400;
    const DOS_PI = 2 * Math.PI;
    for (let i = 0; i < n; i++) {
      const vuelta0 = Math.floor(this.e.theta / DOS_PI);
      pasoMotor(this.e, this.p, this.c, h);
      const e = this.e;
      // tacómetro: la cinta pasa por el sensor en θ = 2πk
      if (Math.floor(e.theta / DOS_PI) !== vuelta0) {
        const T = e.t - this.tacho.tPulso;
        this.tacho.periodo = T;
        this.tacho.tPulso = e.t;
        this.tacho.pulsos++;
        this.tacho.rpm = Number.isFinite(T) && T > 0 ? (60 / T) * Math.sign(e.omega || 1) : 0;
      }
      // conmutación
      const b = bobinaActiva(e.theta).bobina;
      if (b !== this.bobina) { this.bobina = b; this.tConmuta = e.t; this.conmutaciones++; }
      // historia
      if (e.t - this.tUltimaMuestra >= dtHist) {
        this.tUltimaMuestra = e.t;
        this.ht[this.hi] = e.t; this.hw[this.hi] = e.omega; this.hI[this.hi] = e.I;
        this.hi = (this.hi + 1) % CAP;
        this.hn = Math.min(CAP, this.hn + 1);
      }
    }
  }

  /** Muestra k-ésima de la historia (0 = la más antigua). */
  muestra(k: number): { t: number; w: number; I: number } {
    const j = (this.hi - this.hn + k + CAP * 2) % CAP;
    return { t: this.ht[j], w: this.hw[j], I: this.hI[j] };
  }

  /** Lo que marcan los instrumentos en este cuadro. */
  lectura(): Lectura {
    const { p, c, e } = this;
    const I = corriente(p, c, e.omega);
    const E = fcemMedia(c, p.N, e.omega);
    const Pel = p.energizado ? p.V * I : 0;
    const R = rArmadura(p.N);
    const Pfreno = Math.abs(e.tauFreno * e.omega);
    // sin pulsos durante 1,5 s (o 3 periodos) el tacómetro cae a 0
    const sin = e.t - this.tacho.tPulso;
    let nTacho = this.tacho.rpm;
    if (!(sin < Math.max(1.5, 3 * this.tacho.periodo))) nTacho = 0;
    else if (sin > this.tacho.periodo * 1.05) nTacho = Math.sign(nTacho) * Math.min(Math.abs(nTacho), 60 / sin);
    return {
      nTacho, omega: e.omega, I, E, Pel, Pjoule: I * I * R, Pint: E * I, Pfreno,
      eta: Pel > 1e-9 ? Math.max(0, (E * I) / Pel) : null, tau: e.tau, tauFreno: e.tauFreno,
    };
  }

  /** rpm del modelo (ω instantánea). */
  get rpm() { return aRpm(this.e.omega); }
  /** constante del motor de los mandos actuales */
  get k() { return kMotor(this.p.N); }
}
