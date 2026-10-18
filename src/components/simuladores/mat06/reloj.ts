/**
 * mat06/reloj.ts — EL RELOJ ÚNICO del taller de transformaciones (módulo puro, sin three
 * ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar). La pieza de vidrio, su sombra sobre la placa, las trayectorias de los vértices,
 * la matriz del dock, su determinante, el paralelogramo de la base y la tabla de
 * coordenadas leen `lectura()` de ESE cuadro.
 *
 *  · TALLER (exploración): la figura viaja a su imagen (ida), se queda (pausa), vuelve por
 *    el mismo camino —la transformación inversa— y espera. Con el recorrido activo, cada
 *    vuelta completa pasa a la estación siguiente (rotación → reflexión → homotecia →
 *    traslación → composición). Cada estación guarda sus mandos.
 *  · RETO: la placa del alumno sigue a los mandos del store (T·R·S) con una transición
 *    corta; la matriz que se lee es la de la pose dibujada en ese cuadro.
 */
import {
  PIEZA, PUNTOS_CLAVE, ORIGINAL, M_ORIGINAL, PARAMS_INICIALES, TIPOS, aplicar, det2, matrizEn, matrizFinal, trs,
  type Mat3, type P2, type ParamsT, type TipoT,
} from './transformaciones';

export type ModoM6 = 'explorar' | 'reto';
export type Fase = 'ida' | 'pausa' | 'vuelta' | 'espera';

/** Duraciones (s de pantalla): la composición tiene dos tramos y dura más. */
export const DURACION = { ida: 2.6, idaComposicion: 3.8, pausa: 1.6, vuelta: 1.1, espera: 0.5 } as const;

/** Suavizado de entrada y salida (cúbica): arranca y llega con velocidad cero. */
export function suave(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export interface PoseReto { tx: number; ty: number; rot: number; s: number }
export interface PuntoLectura { id: 'A' | 'B' | 'C' | 'P'; orig: P2; ahora: P2; ahora2?: P2 }
export interface LecturaM6 {
  modo: ModoM6;
  tipo: TipoT;
  fase: Fase;
  /** progreso lineal del viaje (0 original → 1 imagen) y parámetro geométrico suavizado */
  u: number;
  t: number;
  /** matriz de la pose de ESTE cuadro y su determinante (en la composición, la rama T·R) */
  M: Mat3;
  det: number;
  /** composición: la rama R·T */
  M2?: Mat3;
  det2?: number;
  /** puntos clave: original → ahora */
  puntos: PuntoLectura[];
}

const distAng = (a: number, b: number) => ((((b - a + 180) % 360) + 360) % 360) - 180;

export class RelojTransf {
  readonly modo: ModoM6;
  tipo: TipoT = TIPOS[0];
  params: Record<TipoT, ParamsT>;
  /** recorrido automático por las cinco estaciones */
  recorrido = true;
  pausa = false;
  fase: Fase = 'ida';
  u = 0;
  espera = 0;
  ciclos = 0;
  /** reto: lo que piden los mandos y lo que se dibuja (con transición) */
  meta: PoseReto = { tx: 0, ty: 0, rot: 0, s: 1 };
  pose: PoseReto = { tx: 0, ty: 0, rot: 0, s: 1 };
  version = 0;
  private subs = new Set<() => void>();

  constructor(modo: ModoM6) {
    this.modo = modo;
    this.params = { ...PARAMS_INICIALES };
    for (const k of TIPOS) this.params[k] = { ...PARAMS_INICIALES[k] };
  }

  suscribir(f: () => void): () => void { this.subs.add(f); return () => { this.subs.delete(f); }; }
  private avisar() { this.version++; this.subs.forEach((f) => f()); }

  get p(): ParamsT { return this.params[this.tipo]; }
  get composicion(): boolean { return this.tipo === 'composicion'; }
  durIda(): number { return this.composicion ? DURACION.idaComposicion : DURACION.ida; }

  // ───────────── mandos del taller ─────────────

  /** Cambia de estación: el viaje empieza otra vez desde la figura original. */
  setTipo(t: TipoT, manual = true) {
    if (manual) this.recorrido = false;
    this.tipo = t;
    this.fase = 'ida';
    this.u = 0;
    this.avisar();
  }

  /** Cambia un mando de la estación actual: la imagen y la matriz cambian en este mismo cuadro. */
  setParam(parcial: Partial<ParamsT>) {
    this.params[this.tipo] = { ...this.params[this.tipo], ...parcial };
    this.recorrido = false;
    this.avisar();
  }

  setRecorrido(on: boolean) {
    this.recorrido = on;
    if (on) this.pausa = false;
    this.avisar();
  }

  setPausa(on: boolean) { this.pausa = on; this.avisar(); }

  /** Lleva la figura a un punto del viaje (deslizador «Avance»): pausa el bucle. */
  setAvance(u: number) {
    this.pausa = true;
    this.recorrido = false;
    this.fase = 'ida';
    this.u = Math.min(1, Math.max(0, u));
    this.avisar();
  }

  /** Movimiento reducido: la imagen ya colocada, sin bucle ni recorrido. */
  estatico() {
    this.pausa = true;
    this.recorrido = false;
    this.fase = 'pausa';
    this.u = 1;
    this.avisar();
  }

  // ───────────── reto ─────────────

  /** Lo que piden los mandos del store. `salto` coloca la pieza sin transición. */
  setMeta(m: PoseReto, salto = false) {
    this.meta = { ...m };
    if (salto) this.pose = { ...m };
    this.avisar();
  }

  // ───────────── tiempo ─────────────

  /** Parámetro geométrico del instante: suavizado; en la composición, cada tramo por separado. */
  get t(): number {
    if (!this.composicion) return suave(this.u);
    return this.u < 0.5 ? 0.5 * suave(2 * this.u) : 0.5 + 0.5 * suave(2 * this.u - 1);
  }

  paso(dtReal: number) {
    if (!(dtReal > 0)) return;
    const dt = Math.min(dtReal, 0.1);
    if (this.modo === 'reto') {
      const m = this.meta, p = this.pose;
      const k = 1 - Math.exp(-dt * 9);
      const dr = distAng(p.rot, m.rot);
      if (Math.abs(m.tx - p.tx) < 1e-3 && Math.abs(m.ty - p.ty) < 1e-3 && Math.abs(m.s - p.s) < 1e-3 && Math.abs(dr) < 0.05) {
        if (p.tx !== m.tx || p.ty !== m.ty || p.s !== m.s || p.rot !== m.rot) { this.pose = { ...m }; this.avisar(); }
        return;
      }
      p.tx += (m.tx - p.tx) * k; p.ty += (m.ty - p.ty) * k; p.s += (m.s - p.s) * k; p.rot += dr * k;
      this.avisar();
      return;
    }
    if (this.pausa) return;
    switch (this.fase) {
      case 'ida':
        this.u = Math.min(1, this.u + dt / this.durIda());
        if (this.u >= 1) { this.fase = 'pausa'; this.espera = DURACION.pausa; }
        this.avisar();
        break;
      case 'pausa':
        this.espera -= dt;
        if (this.espera <= 0) this.fase = 'vuelta';
        break;
      case 'vuelta':
        this.u = Math.max(0, this.u - dt / DURACION.vuelta);
        if (this.u <= 0) {
          this.fase = 'espera';
          this.espera = DURACION.espera;
          this.ciclos++;
          // el recorrido cambia de estación con la figura de vuelta en su sitio
          if (this.recorrido) this.tipo = TIPOS[(TIPOS.indexOf(this.tipo) + 1) % TIPOS.length];
        }
        this.avisar();
        break;
      case 'espera':
        this.espera -= dt;
        if (this.espera <= 0) { this.fase = 'ida'; this.avisar(); }
        break;
    }
  }

  // ───────────── lectura ─────────────

  /** Matriz de la pose de este cuadro (rama 0; en la composición, la 1 es R·T). */
  matriz(rama: 0 | 1 = 0): Mat3 {
    if (this.modo === 'reto') { const q = this.pose; return trs(q.tx, q.ty, q.rot, q.s); }
    return matrizEn(this.tipo, this.p, this.t, rama);
  }

  /** Matriz final de la estación (la de llegada). */
  matrizFinal(rama: 0 | 1 = 0): Mat3 {
    if (this.modo === 'reto') { const q = this.meta; return trs(q.tx, q.ty, q.rot, q.s); }
    return matrizFinal(this.tipo, this.p, rama);
  }

  /** La figura de partida en el plano: la pieza en el origen (reto) o colocada en el taller. */
  get original(): readonly P2[] { return this.modo === 'reto' ? PIEZA : ORIGINAL; }

  /** Los puntos clave de la figura de partida (en el taller, ya colocados). */
  puntosOriginales(): { id: PuntoLectura['id']; p: P2 }[] {
    if (this.modo === 'reto') return PUNTOS_CLAVE.map((k) => ({ id: k.id, p: k.p }));
    // en el taller la figura está colocada por M_ORIGINAL
    return PUNTOS_CLAVE.map((k) => ({ id: k.id, p: aplicar(M_ORIGINAL, k.p) }));
  }

  lectura(): LecturaM6 {
    const M = this.matriz(0);
    const comp = this.modo === 'explorar' && this.composicion;
    const M2 = comp ? this.matriz(1) : undefined;
    const puntos = this.puntosOriginales().map(({ id, p }) => ({
      id, orig: p, ahora: aplicar(M, p), ...(M2 ? { ahora2: aplicar(M2, p) } : {}),
    }));
    return {
      modo: this.modo, tipo: this.tipo, fase: this.fase, u: this.u, t: this.modo === 'reto' ? 1 : this.t,
      M, det: det2(M), ...(M2 ? { M2, det2: det2(M2) } : {}), puntos,
    };
  }
}
