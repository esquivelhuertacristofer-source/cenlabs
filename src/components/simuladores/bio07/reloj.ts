/**
 * bio07/reloj.ts — LOS RELOJES del lab (sin three). Uno por modo; sólo corre el del
 * modo visible. Cada cuadro la escena llama a `avanzar(dtPared)` ANTES de pintar (prioridad
 * −1) y el reloj avisa a sus suscriptores (el dock): escena, trazas y cifras salen del
 * mismo estado en el mismo cuadro.
 *
 * CÁMARA LENTA ROTULADA. El factor es «ms de modelo por ms de pared»:
 *  · Banco: el que elige el alumno (×1/1 000, ×1/5 000, ×1/20 000) mientras hay
 *    corriente de Na⁺ apreciable (el PA está naciendo o viajando); fuera de eso, avance
 *    rápido a ×1/150 (la posthiperpolarización y el reposo). El rótulo dice cuál toca.
 *  · Arco: el martillo cae a ×1/3; el impulso nervioso va a ×1/100 (o ×1/30, ×1/300);
 *    la sacudida del músculo, a ×1/4.
 */
import { BancoNeurona, type ConfigBanco } from './banco';
import { cronograma, registroMotoneurona, type Cronograma, type RegistroMN } from './arco';

type Sub = () => void;

/** Avance rápido del banco (ms de modelo por ms de pared) cuando no pasa nada. */
export const RAPIDO_BANCO = 1 / 150;
export const LENTOS_BANCO = [1 / 1000, 1 / 5000, 1 / 20000] as const;
export const LENTOS_ARCO = [1 / 30, 1 / 100, 1 / 300] as const;
/** Fases mecánicas del arco. */
export const FACTOR_MARTILLO = 1 / 3;
export const FACTOR_SACUDIDA = 1 / 4;
/** Duración del balanceo del martillo antes del contacto (ms reales). */
export const T_BALANCEO = 110;
/** Retardo de la placa motora en el banco (ms): el mismo del dominio. */
export const PLACA_BANCO = 0.8;

/** «×1/5 000» con separador de millares (U+202F). */
export function rotuloFactor(f: number): string {
  if (f >= 0.999) return '×1';
  const n = Math.round(1 / f);
  return `×1/${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

export class RelojBanco {
  banco: BancoNeurona;
  /** factor de cámara lenta elegido y el que corre ahora (suavizado en escala log) */
  lento: number = LENTOS_BANCO[1];
  factor: number = LENTOS_BANCO[1];
  pausa = false;
  /** estimulación automática (un barrido cada vez que el cable vuelve al reposo) */
  automatico = true;
  private espera = 0.35;
  private subs = new Set<Sub>();
  /** V del cuadro anterior (para dV/dt del frente) y el paso de modelo del cuadro */
  Vprev: Float64Array;
  dtCuadro = 0;
  version = 0;

  constructor(cfg: ConfigBanco) {
    this.banco = new BancoNeurona(cfg);
    this.Vprev = Float64Array.from(this.banco.cable.V);
  }

  configurar(cfg: Partial<ConfigBanco>) {
    const antes = this.banco.versionFibra;
    this.banco.configurar(cfg);
    if (this.banco.versionFibra !== antes) { this.Vprev = Float64Array.from(this.banco.cable.V); this.espera = 0.25; }
    this.version++;
    this.avisar();
  }

  /** Estímulo manual (o del automático): la cámara lenta entra ya, sin esperar al suavizado. */
  estimular() {
    this.banco.estimular();
    this.factor = this.lento;
    this.espera = 1.0;
    this.version++;
    this.avisar();
  }

  avanzar(dtPared: number) {
    const b = this.banco;
    // en pausa no se toca Vprev ni dtCuadro: la escena sigue viendo el frente donde quedó
    if (this.pausa) { this.avisar(); return; }
    const dt = Math.min(0.05, Math.max(0, dtPared)); // s
    // ¿toca otro barrido?
    if (this.automatico && (b.t0Barrido < 0 || (b.barridoTerminado && b.enReposo))) {
      this.espera -= dt;
      if (this.espera <= 0) this.estimular();
    }
    const activo = b.actividad() > 4 || (b.t0Barrido >= 0 && b.cable.t - b.t0Barrido < 0.35);
    // la placa motora (0,8 ms de retardo) y el PA muscular, a ×1/1 000
    const tL = b.llegadaTerminal;
    const enPlaca = tL > 0 && b.cable.t < tL + PLACA_BANCO + 1.8;
    const objetivo = activo ? this.lento : enPlaca ? Math.max(this.lento, 1 / 1000) : RAPIDO_BANCO;
    if (objetivo <= this.factor) this.factor = objetivo; // hacia más lento: de golpe (no perder el frente)
    else this.factor = Math.exp(Math.log(this.factor) + (Math.log(objetivo) - Math.log(this.factor)) * (1 - Math.exp(-dt / 0.3)));
    this.Vprev.set(b.cable.V);
    const ms = dt * 1000 * this.factor;
    b.avanzar(ms, activo ? 0.002 : 0.01);
    this.dtCuadro = ms;
    this.avisar();
  }

  /** ¿Está en cámara lenta (no en avance rápido)? */
  get enLenta() { return this.factor < RAPIDO_BANCO * 0.5; }

  suscribir(fn: Sub) { this.subs.add(fn); return () => { this.subs.delete(fn); }; }
  private avisar() { this.subs.forEach((f) => f()); }
}

/** Un golpe del martillo, listo para animar: tiempos del dominio + registro de la motoneurona. */
export interface EnsayoArco {
  /** ¿hubo reflejo? */
  supra: boolean;
  /** latencia golpe → EMG (ms) del dominio (o la que tendría, si no hubo reflejo: fija la llegada de la descarga Ia) */
  L: number;
  /** latencia que ve el EMG (null sin respuesta) */
  Lemg: number | null;
  fuerza: number;
  cron: Cronograma;
  /** registro intracelular de la motoneurona; t = 0 en la llegada de la descarga Ia */
  mn: RegistroMN;
  /** número del ensayo (semilla del ruido del EMG) */
  n: number;
}

export function nuevoEnsayo(o: { supra: boolean; L: number; fuerza: number; n: number; tSinapsis: number; tPlaca: number }): EnsayoArco {
  return {
    supra: o.supra, L: o.L, Lemg: o.supra ? o.L : null, fuerza: o.fuerza, n: o.n,
    cron: cronograma(o.L, o.tSinapsis, o.tPlaca),
    mn: registroMotoneurona(o.supra, o.fuerza, o.tSinapsis),
  };
}

export type FaseArco = 'reposo' | 'martillo' | 'impulso' | 'sacudida';

export class RelojArco {
  /** ms del paciente desde el golpe (negativo mientras cae el martillo) */
  t = -Infinity;
  ensayo: EnsayoArco | null = null;
  activo = false;
  lento: number = LENTOS_ARCO[1];
  factor: number = LENTOS_ARCO[1];
  pausa = false;
  private subs = new Set<Sub>();
  private alTerminar: (() => void) | null = null;

  /** Fin de la fase nerviosa: respuesta + 6 ms (o, sin reflejo, el PEPS ya apagado). */
  finImpulso(e = this.ensayo) { return e ? (e.supra ? e.L + 6 : e.cron.llegadaMedula + 5) : 0; }
  /** Fin del ensayo entero: la pierna vuelve al reposo (sacudida < 2 %) o el martillo a su sitio. */
  finEnsayo(e = this.ensayo) { return e ? (e.supra ? e.L + 2 + 7 * 70 : Math.max(this.finImpulso(e) + 4, 160)) : 0; }

  /** Termina el ensayo ya (seguridad: la escena no corrió, o movimiento reducido). */
  terminar() {
    if (!this.activo || !this.ensayo) return;
    this.t = this.finEnsayo();
    this.activo = false;
    const fn = this.alTerminar; this.alTerminar = null;
    fn?.();
    this.avisar();
  }

  get fase(): FaseArco {
    if (!this.activo || !this.ensayo) return 'reposo';
    if (this.t < 0) return 'martillo';
    if (this.t < this.finImpulso()) return 'impulso';
    return 'sacudida';
  }

  iniciar(e: EnsayoArco, alTerminar?: () => void) {
    this.ensayo = e;
    this.t = -T_BALANCEO;
    this.activo = true;
    this.factor = FACTOR_MARTILLO;
    this.alTerminar = alTerminar ?? null;
    this.avisar();
  }

  /** Lleva el ensayo a un instante (capturas y pruebas en desarrollo). */
  irA(t: number) { if (this.ensayo) { this.t = t; this.activo = t < this.finEnsayo(); this.avisar(); } }

  avanzar(dtPared: number) {
    if (!this.activo || !this.ensayo) { this.avisar(); return; }
    if (this.pausa) { this.avisar(); return; }
    const dt = Math.min(0.05, Math.max(0, dtPared)) * 1000; // ms de pared
    const f = this.fase;
    const objetivo = f === 'martillo' ? FACTOR_MARTILLO : f === 'impulso' ? this.lento : FACTOR_SACUDIDA;
    if (objetivo <= this.factor) this.factor = objetivo;
    else this.factor = Math.exp(Math.log(this.factor) + (Math.log(objetivo) - Math.log(this.factor)) * (1 - Math.exp(-dt / 250)));
    let paso = dt * this.factor;
    // no saltarse el contacto: el impulso empieza exactamente en t = 0
    if (this.t < 0 && this.t + paso > 0) { paso = -this.t; this.factor = this.lento; }
    this.t += paso;
    if (this.t >= this.finEnsayo()) {
      this.t = this.finEnsayo();
      this.activo = false;
      const fn = this.alTerminar; this.alTerminar = null;
      fn?.();
    }
    this.avisar();
  }

  suscribir(fn: Sub) { this.subs.add(fn); return () => { this.subs.delete(fn); }; }
  private avisar() { this.subs.forEach((g) => g()); }
}
