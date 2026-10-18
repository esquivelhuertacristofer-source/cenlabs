/**
 * mat08/reloj.ts — EL RELOJ ÚNICO del banco de la derivada (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dt)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar). El reloj mueve el punto x₀ y el incremento h, y anota dónde ha pasado el
 * trazador de f′. La escena, el dock y la barra de lecturas leen el MISMO objeto en ese
 * cuadro (comparando `version`), así que secante, tabla, gráficas y cifras coinciden.
 *
 * Coreografía del recorrido (exploración, estado inicial):
 *   abrir      h sube de h_min a h₀ (el punto Q se separa de P)
 *   converger  h = h₀·10^(−D·τ): la secante gira continuamente hasta la tangente
 *   sostener   secante = tangente
 *   deslizar   x₀ viaja a la estación siguiente con h = h_min y el trazador dibuja
 *              f′(x) bajo la curva (la derivada «sale» de la función)
 *   final      la traza completa se sostiene, se desvanece y el recorrido vuelve.
 *
 * NO REGALAR. En el reto el trazador NO deja traza: v(t) = s′(t) (cuyo máximo es la
 * incógnita) sólo se revela, de izquierda a derecha, tras validar (`revelar`). Antes,
 * el panel de v sólo muestra el punto de ahora y las mediciones que el alumno anota.
 */
import {
  cociente, cocienteAdelante, cocienteCentrado, rangosCurva, puntosCriticos, inflexiones,
  type Curva, type Metodo, type Rangos, type PuntoNotable,
} from './derivada';

export type ModoM8 = 'explorar' | 'reto';
export type Fase = 'abrir' | 'converger' | 'sostener' | 'deslizar' | 'final';

/** Velocidad del límite: décadas de h por segundo. */
export const DECADAS_POR_S = 1.25;
export const T_ABRIR = 0.6;
export const T_SOSTENER = 0.7;
/** s por cada 20 % del dominio que recorre el carro */
export const T_DESLIZAR = 1.9;
export const T_FINAL = 3.2;
export const T_REVELAR = 1.6;
export const N_BINS = 512;
export const N_ESTACIONES = 5;
/** h₀ y h_min como fracción del dominio */
export const FRAC_H_MAX = 0.3;
export const FRAC_H_MIN = 3e-4;
export const MAX_MEDICIONES = 16;

export interface Medicion { id: number; t: number; v: number }

export interface LecturaM8 {
  x0: number;
  /** h con signo (negativo cuando Q queda a la izquierda, al final del dominio) */
  h: number;
  hAbs: number;
  fx: number;
  /** f(x₀ + h) y f(x₀ − h) */
  fP: number;
  fM: number;
  dAdelante: number;
  dCentrada: number;
  /** el cociente del método elegido: la pendiente de la secante dibujada */
  d: number;
  /** el límite: f′(x₀) */
  d1: number;
  d2: number;
  metodo: Metodo;
}

const suave = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

export class RelojDerivada {
  curva: Curva;
  rangos: Rangos;
  modo: ModoM8;
  metodo: Metodo = 'adelante';
  x0: number;
  hAbs: number;
  /** el carro recorre las estaciones solo (exploración) */
  recorrido: boolean;
  /** h baja sola hacia 0, en ciclos */
  hAuto = true;
  /** reto: el cohete vuela a 1 s de vuelo por segundo real (sin cámara lenta) */
  vuelo = false;
  pausa = false;
  fase: Fase = 'converger';
  /** tiempo dentro de la fase (s) */
  tf = 0;
  /** h al empezar a converger */
  h0 = 1;
  estacion = 0;
  sentido: 1 | -1 = 1;
  private desde = 0;
  private hasta = 0;
  private durDeslizar = T_DESLIZAR;
  /** casillas del dominio por donde ha pasado el trazador de f′ */
  visitado = new Uint8Array(N_BINS);
  versionTraza = 0;
  /** opacidad de la traza (se desvanece al final del recorrido) */
  desvanecer = 1;
  /** reto: fracción revelada de v(t) tras validar (0 … 1) */
  revelado = 0;
  revelando = false;
  mediciones: Medicion[] = [];
  private idMedicion = 0;
  criticos: PuntoNotable[];
  inflexiones: PuntoNotable[];
  version = 0;

  constructor(curva: Curva, modo: ModoM8, x0?: number) {
    this.curva = curva;
    this.modo = modo;
    this.rangos = rangosCurva(curva);
    this.criticos = puntosCriticos(curva);
    this.inflexiones = inflexiones(curva);
    this.recorrido = modo === 'explorar';
    this.x0 = x0 ?? this.posEstacion(0);
    this.h0 = this.hInicio();
    this.hAbs = this.h0;
  }

  // ── geometría del dominio ──
  get a() { return this.curva.dominio[0]; }
  get b() { return this.curva.dominio[1]; }
  get span() { return this.b - this.a; }
  get hMin() { return FRAC_H_MIN * this.span; }
  get hMax() { return FRAC_H_MAX * this.span; }
  posEstacion(i: number) { return this.a + this.span * (0.1 + (0.8 * i) / (N_ESTACIONES - 1)); }

  /** El mayor h que cabe en el dominio desde x (delante: el lado con más sitio; centrada: el menor). */
  hCabe(x = this.x0): number {
    const izq = x - this.a, der = this.b - x;
    const sitio = this.metodo === 'centrada' ? Math.min(izq, der) : Math.max(izq, der);
    return Math.max(this.hMin * 4, sitio * 0.97);
  }
  hInicio(x = this.x0) { return Math.min(this.hMax, this.hCabe(x)); }
  /** +1 si Q = x₀ + h cabe a la derecha; −1 si hay que acercarse por la izquierda. */
  signoH(x = this.x0, hAbs = this.hAbs): 1 | -1 {
    if (this.metodo === 'centrada') return 1;
    return x + hAbs <= this.b + 1e-9 ? 1 : -1;
  }
  get h() { return this.signoH() * this.hAbs; }

  // ── la traza de f′ ──
  private bin(x: number) { return Math.min(N_BINS - 1, Math.max(0, Math.floor(((x - this.a) / this.span) * N_BINS))); }
  /** Marca como dibujado el tramo [xa, xb] (sólo en la exploración, o al revelar el reto). */
  marcar(xa: number, xb: number) {
    const i0 = this.bin(Math.min(xa, xb)), i1 = this.bin(Math.max(xa, xb));
    let cambio = false;
    for (let i = i0; i <= i1; i++) if (!this.visitado[i]) { this.visitado[i] = 1; cambio = true; }
    if (cambio) this.versionTraza++;
  }
  borrarTraza() { this.visitado.fill(0); this.versionTraza++; }
  /** ¿El trazador ya pasó por x? (los puntos notables aparecen al descubrirlos) */
  descubierto(x: number) { return this.visitado[this.bin(x)] === 1; }
  fraccionTrazada() { let n = 0; for (let i = 0; i < N_BINS; i++) n += this.visitado[i]; return n / N_BINS; }

  // ── el paso del reloj ──
  /** Avanza dt segundos de pantalla. Devuelve true si algo visible cambió. */
  paso(dtReal: number): boolean {
    if (this.pausa || !(dtReal > 0)) return false;
    const dt = Math.min(dtReal, 0.1);
    const x = this.x0, h = this.hAbs, r = this.revelado, ds = this.desvanecer, vt = this.versionTraza;
    if (this.modo === 'reto' && this.vuelo) {
      let nx = this.x0 + dt;
      if (nx > this.b) nx = this.a;
      this.x0 = nx;
      this.hAbs = this.hMin;
    } else if (this.modo === 'explorar' && this.recorrido) this.avanzarRecorrido(dt);
    else if (this.hAuto) this.avanzarCiclo(dt);
    if (this.revelando && this.revelado < 1) {
      this.revelado = Math.min(1, this.revelado + dt / T_REVELAR);
      this.marcar(this.a, this.a + this.span * this.revelado);
    }
    const cambio = x !== this.x0 || h !== this.hAbs || r !== this.revelado || ds !== this.desvanecer || vt !== this.versionTraza;
    if (cambio) this.version++;
    return cambio;
  }

  private irA(f: Fase) { this.fase = f; this.tf = 0; }

  /** abrir → converger → sostener, la fase común del ciclo y del recorrido. Devuelve true al terminar «sostener». */
  private avanzarH(dt: number): boolean {
    this.tf += dt;
    if (this.fase === 'abrir') {
      const u = suave(this.tf / T_ABRIR);
      this.hAbs = this.hMin * (this.h0 / this.hMin) ** u;
      if (this.tf >= T_ABRIR) { this.hAbs = this.h0; this.irA('converger'); }
    } else if (this.fase === 'converger') {
      const hh = this.h0 * 10 ** (-DECADAS_POR_S * this.tf);
      if (hh <= this.hMin) { this.hAbs = this.hMin; this.irA('sostener'); } else this.hAbs = hh;
    } else if (this.fase === 'sostener') {
      this.hAbs = this.hMin;
      if (this.tf >= T_SOSTENER) return true;
    }
    return false;
  }

  /** h en ciclos en el x₀ actual (reto, o exploración sin recorrido). */
  private avanzarCiclo(dt: number) {
    if (this.fase === 'deslizar' || this.fase === 'final') this.irA('sostener');
    if (this.avanzarH(dt)) { this.h0 = this.hInicio(); this.irA('abrir'); }
  }

  private avanzarRecorrido(dt: number) {
    if (this.fase === 'deslizar') {
      this.tf += dt;
      const u = suave(this.tf / this.durDeslizar);
      const nx = this.desde + (this.hasta - this.desde) * u;
      this.marcar(this.x0, nx);
      this.x0 = nx;
      this.hAbs = this.hMin;
      if (this.tf >= this.durDeslizar) { this.x0 = this.hasta; this.h0 = this.hInicio(); this.irA('abrir'); }
      return;
    }
    if (this.fase === 'final') {
      this.tf += dt;
      this.hAbs = this.hMin;
      const resto = T_FINAL - this.tf;
      this.desvanecer = resto < 0.8 ? Math.max(0, resto / 0.8) : 1;
      if (this.tf >= T_FINAL) {
        this.borrarTraza();
        this.desvanecer = 1;
        this.sentido = this.sentido === 1 ? -1 : 1;
        this.h0 = this.hInicio();
        this.irA('abrir');
      }
      return;
    }
    if (this.avanzarH(dt)) {
      const sig = this.estacion + this.sentido;
      if (sig < 0 || sig >= N_ESTACIONES) { this.irA('final'); return; }
      this.estacion = sig;
      this.desde = this.x0;
      this.hasta = this.posEstacion(sig);
      this.durDeslizar = T_DESLIZAR * Math.max(0.5, Math.abs(this.hasta - this.desde) / (0.2 * this.span));
      this.irA('deslizar');
    }
  }

  // ── mandos ──
  /** El alumno mueve x₀: se para el recorrido; en la exploración el trazador dibuja el tramo recorrido. */
  setX0(x: number) {
    const nx = Math.min(this.b, Math.max(this.a, x));
    if (this.modo === 'explorar') {
      if (Math.abs(nx - this.x0) <= 0.06 * this.span) this.marcar(this.x0, nx); else this.marcar(nx, nx);
    }
    this.recorrido = false;
    this.vuelo = false;
    if (this.fase === 'deslizar' || this.fase === 'final') { this.desvanecer = 1; this.irA('sostener'); }
    this.x0 = nx;
    if (this.hAbs > this.hCabe()) this.hAbs = this.hCabe();
    this.version++;
  }

  /** El alumno fija h: se paran el ciclo y el recorrido. */
  setH(h: number) {
    this.hAuto = false;
    this.recorrido = false;
    this.vuelo = false;
    if (this.fase === 'deslizar' || this.fase === 'final') { this.desvanecer = 1; this.irA('sostener'); }
    this.hAbs = Math.min(this.hCabe(), Math.max(this.hMin, Math.abs(h)));
    this.version++;
  }

  /** «h → 0»: vuelve a abrir la secante y la hace converger (en ciclos). */
  reiniciarH() {
    this.hAuto = true;
    this.vuelo = false;
    if (this.fase === 'deslizar' || this.fase === 'final') this.desvanecer = 1;
    this.h0 = this.hInicio();
    this.irA('abrir');
    this.version++;
  }

  setMetodo(m: Metodo) {
    if (m === this.metodo) return;
    this.metodo = m;
    if (this.hAbs > this.hCabe()) this.hAbs = this.hCabe();
    this.h0 = Math.min(this.h0, this.hInicio());
    this.version++;
  }

  /** Recorrido automático de las estaciones (sólo exploración). */
  setRecorrido(on: boolean) {
    if (this.modo !== 'explorar') return;
    this.recorrido = on;
    if (on) {
      this.hAuto = true;
      // la estación más cercana en el sentido de marcha
      let mejor = 0;
      for (let i = 0; i < N_ESTACIONES; i++) if (Math.abs(this.posEstacion(i) - this.x0) < Math.abs(this.posEstacion(mejor) - this.x0)) mejor = i;
      this.estacion = mejor;
      this.desde = this.x0;
      this.hasta = this.posEstacion(mejor);
      if (Math.abs(this.hasta - this.desde) > 1e-6) {
        this.durDeslizar = T_DESLIZAR * Math.max(0.5, Math.abs(this.hasta - this.desde) / (0.2 * this.span));
        this.irA('deslizar');
      } else { this.h0 = this.hInicio(); this.irA('abrir'); }
    }
    this.version++;
  }

  /** Reto: el vuelo (t avanza 1 s por segundo y la tangente acompaña al cohete). */
  setVuelo(on: boolean) {
    if (this.modo !== 'reto') return;
    this.vuelo = on;
    if (!on) { this.h0 = this.hInicio(); this.irA('abrir'); this.hAuto = true; }
    this.version++;
  }

  /** Movimiento reducido: todo quieto; en la exploración, la traza de f′ completa desde el principio. */
  estatico() {
    this.recorrido = false;
    this.hAuto = false;
    this.vuelo = false;
    this.hAbs = Math.min(this.hCabe(), 0.08 * this.span);
    if (this.modo === 'explorar') this.marcar(this.a, this.b);
    this.version++;
  }

  /** Reto: anota la pendiente de la tangente en el t de ahora (lo que el alumno «mide»). */
  anotar(): Medicion | null {
    if (this.modo !== 'reto') return null;
    const t = Math.round(this.x0 * 100) / 100;
    const v = this.curva.d1(t);
    this.mediciones = this.mediciones.filter((m) => Math.abs(m.t - t) > 1e-9);
    const m: Medicion = { id: ++this.idMedicion, t, v };
    this.mediciones.push(m);
    if (this.mediciones.length > MAX_MEDICIONES) this.mediciones.shift();
    this.version++;
    return m;
  }
  borrarMediciones() { this.mediciones = []; this.version++; }

  /** Reto validado: v(t) se dibuja de izquierda a derecha. */
  revelar() {
    if (this.revelando) return;
    this.revelando = true;
    this.revelado = 0;
    this.version++;
  }
  ocultar() {
    if (!this.revelando && this.revelado === 0) return;
    this.revelando = false;
    this.revelado = 0;
    this.borrarTraza();
    this.version++;
  }

  /** Cambia la curva (otra función, u otro cohete). La traza y las mediciones se reinician. */
  setCurva(c: Curva) {
    this.curva = c;
    this.rangos = rangosCurva(c);
    this.criticos = puntosCriticos(c);
    this.inflexiones = inflexiones(c);
    this.borrarTraza();
    this.mediciones = [];
    this.revelando = false;
    this.revelado = 0;
    this.desvanecer = 1;
    this.vuelo = false;
    this.sentido = 1;
    this.estacion = 0;
    if (this.modo === 'explorar' && this.recorrido) this.x0 = this.posEstacion(0);
    else this.x0 = Math.min(this.b, Math.max(this.a, this.x0));
    this.h0 = this.hInicio();
    this.hAbs = this.h0;
    this.irA(this.hAuto || this.recorrido ? 'converger' : 'sostener');
    if (!this.hAuto && !this.recorrido) this.hAbs = Math.min(this.hCabe(), 0.08 * this.span);
    this.version++;
  }

  // ── lectura del cuadro ──
  lectura(): LecturaM8 {
    const c = this.curva, x = this.x0, hAbs = this.hAbs, h = this.signoH(x, hAbs) * hAbs;
    const dAdelante = cocienteAdelante(c.f, x, h);
    const dCentrada = cocienteCentrado(c.f, x, hAbs);
    return {
      x0: x, h, hAbs, fx: c.f(x), fP: c.f(x + h), fM: c.f(x - hAbs),
      dAdelante, dCentrada, d: cociente(c, x, this.metodo === 'centrada' ? hAbs : h, this.metodo),
      d1: c.d1(x), d2: c.d2(x), metodo: this.metodo,
    };
  }
}
