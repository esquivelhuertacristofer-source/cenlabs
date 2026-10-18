/**
 * bio04/reloj.ts — EL RELOJ ÚNICO del lab de fotosíntesis (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar). En ese paso:
 *   · las condiciones (lámpara, distancia, NaHCO₃, T) fijan las tasas del modelo
 *     (`fotosintesis.ts`): neta, bruta, burbujas/min, pH del lumen y las tasas que dibuja
 *     la escena (fotones, O₂, CO₂, ATP, NADPH, G3P, electrones de la membrana);
 *   · si hay un ensayo en marcha, avanza a cámara rápida (10 min en DURACION_VISUAL_S) y el
 *     O₂ del tubo crece con la tasa neta;
 *   · `tAnim` avanza el tiempo de la animación (se congela en pausa; el ensayo, no).
 * El dock, el tubo y las cifras leen este mismo objeto (comparando `version`).
 */
import {
  tasaNeta, tasaBruta, tasasVisuales, burbujasPorMin, phLumen, ppfdB4, DURACION_B4, esReferencia,
  type Condiciones, type TasasVisuales,
} from './fotosintesis';

/** Segundos de pantalla que representan los 10 min del ensayo (cámara rápida ×240). */
export const DURACION_VISUAL_S = 2.5;
export const CAMARA_RAPIDA_ENSAYO = (DURACION_B4 * 60) / DURACION_VISUAL_S;

export interface Ensayo {
  cond: Condiciones;
  /** minutos simulados del ensayo */
  tMin: number;
  /** mL de O₂ recogidos hasta ahora */
  o2: number;
}
export interface EnsayoHecho { cond: Condiciones; o2: number; reto: boolean }

export class RelojFoto {
  cond: Condiciones;
  /** irradiancia en la ramita (µmol·m⁻²·s⁻¹) */
  I = 0;
  /** tasas neta y bruta (mL O₂/min) */
  neta = 0;
  bruta = 0;
  burbujasMin = 0;
  ph = 7.5;
  tasas!: TasasVisuales;
  /** s de animación (se congela en pausa) y paso de este cuadro */
  tAnim = 0;
  dtAnim = 0;
  /** s de pantalla totales (las burbujas del tubo en tiempo real) */
  tReal = 0;
  pausa = false;
  /** sube cada vez que cambia algo visible */
  version = 0;
  ensayo: Ensayo | null = null;
  ultimo: EnsayoHecho | null = null;
  onFin?: (e: EnsayoHecho) => void;
  /** posición del electrón que sigue la vista de la membrana en el esquema Z (−1: ninguno) */
  trazador = -1;
  /** marca de tiempo del último paso (el panel lo usa para no quedarse colgado si la escena no pinta) */
  ultimoPaso = 0;
  /** paso máximo por cuadro (s): evita saltos tras una pestaña en segundo plano */
  dtMax = 0.1;

  constructor(cond: Condiciones) {
    this.cond = { ...cond };
    this.recalcular();
  }

  private recalcular() {
    const c = this.cond;
    this.I = ppfdB4(c.distancia);
    this.neta = tasaNeta(c);
    this.bruta = tasaBruta(c);
    this.burbujasMin = burbujasPorMin(this.neta);
    this.ph = phLumen(this.bruta);
    this.tasas = tasasVisuales(c);
    this.version++;
  }

  /** Cambia las condiciones (no durante un ensayo: el panel bloquea los controles). */
  fijar(c: Partial<Condiciones>) {
    const n = { ...this.cond, ...c };
    if (n.color === this.cond.color && n.distancia === this.cond.distancia && n.nahco3 === this.cond.nahco3 && n.T === this.cond.T) return;
    this.cond = n;
    this.recalcular();
  }

  iniciarEnsayo() {
    if (this.ensayo) return;
    this.ensayo = { cond: { ...this.cond }, tMin: 0, o2: 0 };
    this.version++;
  }

  /** Avanza dtReal segundos de pantalla. */
  paso(dtReal: number, ahora = 0) {
    if (!(dtReal > 0)) return;
    const dt = Math.min(dtReal, this.dtMax);
    this.ultimoPaso = ahora;
    this.tReal += dt;
    this.dtAnim = this.pausa ? 0 : dt;
    this.tAnim += this.dtAnim;
    const e = this.ensayo;
    if (e) {
      e.tMin = Math.min(DURACION_B4, e.tMin + (dt * CAMARA_RAPIDA_ENSAYO) / 60);
      e.o2 = Math.max(0, tasaNeta(e.cond)) * e.tMin;
      if (e.tMin >= DURACION_B4) {
        const hecho: EnsayoHecho = { cond: e.cond, o2: e.o2, reto: esReferencia(e.cond) };
        this.ensayo = null;
        this.ultimo = hecho;
        this.onFin?.(hecho);
      }
    }
    this.version++;
  }

  /** Vacía el tubo (borrar ensayos). */
  vaciar() { this.ultimo = null; this.version++; }
}
