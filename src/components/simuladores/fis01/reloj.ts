/**
 * fis01/reloj.ts — EL RELOJ ÚNICO del tiro (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar). El tiempo de modelo avanza dtReal·factor y el estado de ESE cuadro (posición,
 * velocidad, energía, imágenes del estroboscopio ya disparadas) sale de la misma trayectoria
 * integrada: la bola, sus sombras, los vectores, el dock y las cifras leen este objeto.
 *
 *  · BANCO (exploración): el cañón dispara en bucle. Vuelo a tiempo real (se acelera, rotulado,
 *    sólo si un vuelo pasara de 5 s de pantalla), la foto completa se mantiene 1,6 s y vuelve
 *    a disparar. Al mover un mando se ve AL INSTANTE la trayectoria nueva completa.
 *  · RETO: sólo existe la trayectoria de un disparo YA lanzado. Dura exactamente lo que el
 *    store tarda en dar el veredicto (`duracionAnimacionMs`), así que la bola toca el suelo
 *    cuando aparece el resultado; el factor (acelerado o lento) se rotula.
 */
import { duracionAnimacionMs, condicionesMision, type Mision1, type Disparo1 } from '@/domain/fisica';
import {
  trayectoria, estadoEn, marcasEstrobo, pasoEstrobo, anguloOptimo, condicionesBanco, energia,
  type Trayectoria, type EstadoTiro,
} from './balistica';

export type ModoReloj = 'banco' | 'reto';
export type Fase = 'vacio' | 'vuelo' | 'espera' | 'quieto';
export interface ParamsBanco { angulo: number; velocidad: number; aire: boolean }

/** s de pantalla con la foto completa antes del siguiente disparo del bucle. */
export const ESPERA_BUCLE = 1.6;
/** s de pantalla del vuelo más largo del banco; si el vuelo dura más, se acelera (rotulado). */
export const VUELO_PANTALLA_MAX = 5;
/** Banco por defecto: θ = 60° (su complementario es 30°), v₀ = 15 m/s, con aire. */
export const BANCO_INICIAL: ParamsBanco = { angulo: 60, velocidad: 15, aire: true };

export interface Lectura {
  t: number; x: number; y: number; vx: number; vy: number; v: number;
  /** energía mecánica por unidad de masa ahora y al salir (J/kg) */
  E: number; E0: number;
  /** del disparo: alcance (o x del choque), altura máxima, tiempo de vuelo */
  R: number; H: number; T: number;
  fin: 'suelo' | 'muro' | 'tiempo';
  enVuelo: boolean;
}

export class RelojTiro {
  readonly modo: ModoReloj;
  p: ParamsBanco;
  tiro: Trayectoria | null = null;
  /** fantasma sin aire (banco con aire) */
  vacio: Trayectoria | null = null;
  /** fantasma del ángulo complementario 90° − θ (mismas condiciones) */
  comp: Trayectoria | null = null;
  /** ángulo de máximo alcance con las condiciones del banco */
  optimo: { angulo: number; alcance: number } | null = null;
  /** imágenes del estroboscopio del disparo actual */
  marcas: EstadoTiro[] = [];
  dtEstrobo = 0.2;
  /** tiempo de modelo dentro del vuelo (s) */
  t = 0;
  fase: Fase = 'vacio';
  /** s de modelo por s de pantalla */
  factor = 1;
  espera = 0;
  pausa = false;
  /** suben con cada disparo y cada aterrizaje (la escena dispara la bocanada y el polvo) */
  disparos = 0;
  aterrizajes = 0;
  /** reto: disparos de esta misión (el dock los dibuja tenues) */
  historial: Trayectoria[] = [];
  /** reto: misión e id del disparo en pantalla */
  mision: Mision1 | null = null;
  idDisparo: number | null = null;
  version = 0;
  private subs = new Set<() => void>();
  private tmp: EstadoTiro = { t: 0, x: 0, y: 0, vx: 0, vy: 0 };

  constructor(modo: ModoReloj, p: ParamsBanco = BANCO_INICIAL) {
    this.modo = modo;
    this.p = { ...p };
    if (modo === 'banco') { this.recalcular(true); this.disparar(); }
  }

  suscribir(f: () => void): () => void { this.subs.add(f); return () => { this.subs.delete(f); }; }
  private avisar() { this.version++; this.subs.forEach((f) => f()); }

  // ───────────── banco ─────────────

  private recalcular(conOptimo: boolean) {
    const { angulo, velocidad, aire } = this.p;
    const cond = condicionesBanco(aire);
    this.tiro = trayectoria(cond, { angulo, velocidad });
    this.vacio = aire ? trayectoria(condicionesBanco(false), { angulo, velocidad }) : null;
    this.comp = trayectoria(cond, { angulo: 90 - angulo, velocidad });
    if (conOptimo || !this.optimo) this.optimo = anguloOptimo(velocidad, cond.g, cond.k);
    this.dtEstrobo = pasoEstrobo(this.tiro.T);
    this.marcas = marcasEstrobo(this.tiro, this.dtEstrobo);
    this.factor = this.tiro.T > VUELO_PANTALLA_MAX ? this.tiro.T / VUELO_PANTALLA_MAX : 1;
  }

  /** Cambia los mandos del banco: la trayectoria nueva se ve completa y el bucle sigue tras la espera. */
  fijar(p: ParamsBanco) {
    if (this.modo !== 'banco') return;
    if (p.angulo === this.p.angulo && p.velocidad === this.p.velocidad && p.aire === this.p.aire) return;
    const conOptimo = p.velocidad !== this.p.velocidad || p.aire !== this.p.aire;
    this.p = { ...p };
    this.recalcular(conOptimo);
    this.t = this.tiro ? this.tiro.T : 0;
    this.fase = 'espera';
    this.espera = ESPERA_BUCLE;
    this.avisar();
  }

  /** Banco: dispara otra vez desde la boca. */
  disparar() {
    if (!this.tiro) return;
    this.t = 0;
    this.fase = 'vuelo';
    this.disparos++;
    this.avisar();
  }

  // ───────────── reto ─────────────

  /** Reto: el disparo que acaba de lanzar el store (misma misión, mismos mandos, mismo juez). */
  dispararReto(m: Mision1, d: Disparo1, id: number) {
    if (this.idDisparo === id && this.fase === 'vuelo') return;
    this.cargarReto(m, d, id);
    this.t = 0;
    this.fase = this.tiro && this.tiro.T > 0 ? 'vuelo' : 'quieto';
    this.disparos++;
    this.avisar();
  }

  /** Reto: un disparo ya resuelto (al volver al modo o recargar la escena), sin animar. */
  restaurarReto(m: Mision1, d: Disparo1, id: number) {
    if (this.idDisparo === id && this.tiro) return;
    this.cargarReto(m, d, id);
    this.t = this.tiro ? this.tiro.T : 0;
    this.fase = 'quieto';
    this.avisar();
  }

  private cargarReto(m: Mision1, d: Disparo1, id: number) {
    const misma = this.mision && this.mision.targetX === m.targetX && this.mision.y0 === m.y0 && this.mision.obsX === m.obsX
      && this.mision.obsY === m.obsY && this.mision.viento === m.viento && this.mision.escenario === m.escenario;
    if (!misma) this.historial = [];
    this.mision = { ...m };
    this.idDisparo = id;
    this.p = { angulo: d.angulo, velocidad: d.velocidad, aire: true };
    this.tiro = trayectoria(condicionesMision(m), d);
    this.vacio = null;
    this.comp = null;
    this.optimo = null;
    if (!this.historial.includes(this.tiro)) this.historial = [...this.historial, this.tiro].slice(-3);
    this.dtEstrobo = pasoEstrobo(this.tiro.T);
    this.marcas = marcasEstrobo(this.tiro, this.dtEstrobo);
    const dur = duracionAnimacionMs(this.tiro.T) / 1000;
    this.factor = this.tiro.T > 0 ? this.tiro.T / dur : 1;
  }

  /** Reto: el store dio el veredicto; la bola queda donde cayó. */
  terminar() {
    if (this.fase !== 'vuelo' || !this.tiro) return;
    this.t = this.tiro.T;
    this.fase = 'quieto';
    this.aterrizajes++;
    this.avisar();
  }

  /** Reto: misión nueva (o reinicio): no hay trayectoria hasta disparar. */
  limpiar(m: Mision1 | null) {
    this.tiro = null; this.vacio = null; this.comp = null; this.marcas = [];
    this.historial = [];
    this.mision = m ? { ...m } : null;
    this.idDisparo = null;
    this.t = 0;
    this.fase = 'vacio';
    this.avisar();
  }

  // ───────────── tiempo ─────────────

  /** Avanza dtReal segundos de pantalla. */
  paso(dtReal: number) {
    if (!(dtReal > 0) || !this.tiro) return;
    if (this.pausa && this.modo === 'banco') return;
    const dt = Math.min(dtReal, 0.1);
    if (this.fase === 'vuelo') {
      this.t += dt * this.factor;
      if (this.t >= this.tiro.T) {
        this.t = this.tiro.T;
        this.fase = this.modo === 'banco' ? 'espera' : 'quieto';
        this.espera = ESPERA_BUCLE;
        this.aterrizajes++;
      }
      this.avisar();
    } else if (this.fase === 'espera') {
      this.espera -= dt;
      if (this.espera <= 0) this.disparar();
    }
  }

  /** Imágenes del estroboscopio ya disparadas (t_k ≤ t). */
  get marcasVisibles(): number {
    let n = 0;
    while (n < this.marcas.length && this.marcas[n].t <= this.t + 1e-9) n++;
    return n;
  }

  /** Estado del balín en este cuadro (null si no hay disparo). */
  estado(out?: EstadoTiro): EstadoTiro | null {
    if (!this.tiro) return null;
    return estadoEn(this.tiro, this.t, out ?? this.tmp);
  }

  /** Lo que marcan los instrumentos en este cuadro. */
  lectura(): Lectura | null {
    const tr = this.tiro;
    if (!tr) return null;
    const e = estadoEn(tr, this.t, { t: 0, x: 0, y: 0, vx: 0, vy: 0 });
    const g = tr.cond.g;
    return {
      t: e.t, x: e.x, y: e.y, vx: e.vx, vy: e.vy, v: Math.hypot(e.vx, e.vy),
      E: energia(e, g), E0: energia(tr.muestras[0], g),
      R: tr.vuelo.hitX, H: tr.vuelo.maxY, T: tr.T, fin: tr.vuelo.fin,
      enVuelo: this.fase === 'vuelo',
    };
  }
}
