/**
 * mat05/reloj.ts — EL RELOJ ÚNICO del círculo trigonométrico (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar): si el punto gira, θ avanza ω·dt. El arrastre con la mano, el deslizador y los
 * botones fijan θ con `fijar`. El dock, la barra de lecturas y la escena leen ESTE objeto
 * (comparando `version`), así que punto, onda, cifras y gráficas son del mismo instante.
 *
 * También guarda el modo (círculo o Fourier), la forma de onda y el número de armónicos:
 * la escena y el dock los leen de aquí para no desfasarse ni un cuadro.
 */
import { norm360, terminos, type Forma, type Termino } from './trigonometria';

/** Velocidad del giro: 30 °/s → una vuelta (2π rad) cada 12 s. */
export const OMEGA_GRADOS = 30;
/** Periodo de una vuelta (s). */
export const PERIODO_S = 360 / OMEGA_GRADOS;

/**
 * Escala del eje θ de la onda: unidades de escena por RADIÁN (el radio del círculo mide 1).
 * El eje es el arco desenrollado a escala 1 : 0,55 (2π rad ocupan 3,46 radios).
 */
export const ESCALA_ONDA = 0.55;
/** Abscisa de escena donde empieza la onda (θ = 0). */
export const X0_ONDA = 1.78;
/** Abscisa de escena del punto de la onda para θ (rad). */
export const xOnda = (rad: number) => X0_ONDA + rad * ESCALA_ONDA;
/** Largo del eje de un periodo completo. */
export const LARGO_ONDA = 2 * Math.PI * ESCALA_ONDA;

export type ModoTrig = 'circulo' | 'fourier';
/** Armónicos (términos no nulos) que ofrece el modo Fourier. */
export const N_MAX = 10;

export class RelojTrig {
  /** ángulo que se ve (°), continuo en [0, 360) */
  theta = 0;
  girando = false;
  /** el alumno arrastra el punto: el giro se detiene */
  arrastrando = false;
  /** vueltas completas desde que empezó a girar (la traza de la onda vuelve a empezar en cada una) */
  vuelta = 0;
  /** sube cada vez que cambia algo visible */
  version = 0;
  modo: ModoTrig = 'circulo';
  forma: Forma = 'cuadrada';
  n = 5;
  /** términos de la serie actual (se recalculan al cambiar forma o n) */
  terminos: Termino[] = terminos('cuadrada', 5);

  /** Avanza dtReal segundos de pantalla. Devuelve true si θ cambió. */
  paso(dtReal: number): boolean {
    if (!this.girando || this.arrastrando || !(dtReal > 0)) return false;
    const t = this.theta + OMEGA_GRADOS * Math.min(dtReal, 0.1);
    if (t >= 360) this.vuelta++;
    this.theta = norm360(t);
    this.version++;
    return true;
  }

  /** Fija θ (°). */
  fijar(grados: number) {
    const g = norm360(grados);
    if (g === this.theta) return;
    this.theta = g;
    this.version++;
  }

  /** Cambia modo, forma o número de armónicos. */
  configurar(c: { modo?: ModoTrig; forma?: Forma; n?: number }) {
    if (c.modo) this.modo = c.modo;
    if (c.forma) this.forma = c.forma;
    if (c.n != null) this.n = Math.max(1, Math.min(N_MAX, Math.round(c.n)));
    this.terminos = terminos(this.forma, this.n);
    this.version++;
  }
}
