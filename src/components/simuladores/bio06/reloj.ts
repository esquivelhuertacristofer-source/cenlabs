/**
 * bio06/reloj.ts — EL RELOJ ÚNICO del lab de selección natural (módulo puro: sin three ni React).
 *
 * La escena llama a `paso(dtPantalla)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar). Aquí vive TODO lo que se mueve: la población (genotipos), la temporada de caza (quién
 * muere, sorteado con `seleccion.ts`), las aves que ejecutan esas muertes, el relevo de cada
 * generación y la historia que dibuja el dock. La escena y el dock sólo LEEN este objeto
 * (comparando `version`): una captura del ave baja en el mismo cuadro la barra del histograma.
 *
 * Dos relojes:
 *  · BOSQUE (exploración): el modelo completo. Cada generación es un año: de día las aves cazan
 *    (las muertes se sortean al empezar con la viabilidad de cada fenotipo y, si el alumno cambia el
 *    hollín o las aves a media temporada, se vuelven a sortear para lo que queda del riesgo); de
 *    noche las supervivientes se aparean (Wright–Fisher) y llega la generación siguiente.
 *  · RETO: la población del store. El ave la mueve el alumno: cada polilla que marca como cazada
 *    se la lleva el ave; el relevo lo dispara «Siguiente generación».
 */
import {
  type Genotipo, type Fenotipo, type Conteo, type Pronostico, type Rng,
  rngSemilla, fenotipoDe, viabilidadesGenotipo, poblacionInicial, reproducir, frecuenciaC, conteoDe,
  frecuenciaCConteo, pronosticar, seleccionDe, DEPREDACION,
} from './seleccion';
import {
  type V3, type Lugar, marcoPosada, sembrar, lugarDelStore, PERCHAS, YAW_PERCHA, puntoFuera,
  suma, resta, escala, normalizar, mezcla, cruz, punto, TRONCO,
} from './bosque';

export type VistaB6 = 'bosque' | 'reto';

// ───────────────────────────── tiempos (s de pantalla a velocidad ×1) ─────────────────────────────

export const TIEMPOS = {
  ida: 0.62, salto: 0.44, agarre: 0.4, pico: 0.14, vuelta: 0.66, comer: 0.6, llegaAve: 1.5,
  /** el ave espera aferrada a la corteza si su próxima presa está a menos de esto */
  esperaMax: 1.5,
  /** noche: crepúsculo, vuelo de apareamiento y amanecer */
  noche: 3.6,
  vueloPolilla: 1.6,
} as const;
/** Cuánto se oscurece el relevo (1 = noche cerrada): un crepúsculo, para no apagar la escena un tercio del tiempo. */
const PENUMBRA = 0.7;

/** Hollín de cada ambiente del reto (el juez sólo distingue «industrial» y «limpio»). */
export const HOLLIN_RETO = { industrial: 0.92, limpio: 0 } as const;
/** Semilla del bosque de partida (elegida para que C no se pierda por deriva en la demo). */
export const SEMILLA_BOSQUE = 82;
/** Condiciones de partida del bosque: Mánchester, 1848. */
export const INICIO_BOSQUE = { hollin: 0.9, aves: 3, N: 40, pC: 0.05, anio: 1848 } as const;

const suave = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function bezier(a: V3, c: V3, b: V3, t: number): V3 {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]];
}
/** Control de un vuelo: por delante del tronco (hacia la cámara) y algo por encima. */
function control(a: V3, b: V3, alto = 1.0, fuera = 2.2): V3 {
  const m = mezcla(a, b, 0.5);
  // empuja el punto medio lejos del eje del tronco y hacia +Z
  const radial = normalizar([m[0], 0, m[2] - TRONCO.zEje]);
  return [m[0] + radial[0] * fuera * 0.6, m[1] + alto, m[2] + radial[2] * fuera * 0.6 + fuera * 0.5];
}
/** Acerca suavemente un vector unitario a otro. */
function acercar(v: V3, meta: V3, k: number): V3 { return normalizar(mezcla(v, meta, k)); }
const ARRIBA: V3 = [0, 1, 0];
/** Base ortonormal (adelante, arriba) a partir de un adelante y un arriba aproximado. */
function ortogonal(adelante: V3, arriba: V3): V3 {
  const d = normalizar(adelante);
  const a = resta(arriba, escala(d, punto(arriba, d)));
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-4 ? escala(a, 1 / l) : normalizar(cruz(cruz(d, [0, 0, 1]), d));
}

// ───────────────────────────── polillas ─────────────────────────────

export type ModoPolilla = 'posada' | 'llegando' | 'saliendo' | 'presa' | 'comida';

export interface PolillaEsc {
  id: number;
  genotipo: Genotipo;
  fenotipo: Fenotipo;
  lugar: Lugar;
  modo: ModoPolilla;
  /** vuelo (llegada o salida): inicio y duración en s del reloj */
  t0: number; dur: number;
  fuera: V3;
  /** destino de la temporada (bosque) */
  muere: boolean;
  /** fracción de la temporada (tiempo biológico) en que muere */
  uMuerte: number;
  tMuerte: number;
  ave: number;
  /** reto: el alumno ya la cazó y el ave va a por ella (no admite otro clic) */
  marcada: boolean;
  /** marco de reposo sobre la corteza (fijo) */
  marco: ReturnType<typeof marcoPosada>;
  // transformada de ESTE cuadro (la escena la lee tal cual)
  pos: V3; cabeza: V3; dorso: V3; ala: number; visible: boolean;
}

function nuevaPolilla(id: number, g: Genotipo, lugar: Lugar): PolillaEsc {
  const m = marcoPosada(lugar.th, lugar.y, lugar.giro);
  return {
    id, genotipo: g, fenotipo: fenotipoDe(g), lugar, modo: 'posada', t0: 0, dur: 0, fuera: [0, 20, 0],
    muere: false, uMuerte: 0, tMuerte: Infinity, ave: -1, marcada: false, marco: m,
    pos: m.pos, cabeza: m.cabeza, dorso: m.n, ala: 0, visible: true,
  };
}

/** Coloca una polilla según su modo y el tiempo del reloj. */
function animarPolilla(p: PolillaEsc, t: number) {
  const m = p.marco;
  if (p.modo === 'posada') {
    p.pos = m.pos; p.cabeza = m.cabeza; p.dorso = m.n; p.ala = 0; p.visible = true;
    return;
  }
  if (p.modo === 'presa' || p.modo === 'comida') { p.visible = false; return; }
  const k = (t - p.t0) / p.dur;
  if (p.modo === 'llegando' && k < 0) { p.visible = false; return; }
  if (p.modo === 'saliendo' && k >= 1) { p.visible = false; return; }
  p.visible = true;
  const cerca = suma(m.pos, escala(m.n, 0.9));
  const batida = Math.sin((t + p.id * 0.137) * Math.PI * 2 * 7.5);
  // ida/vuelta entre `fuera` y el posadero; u = 0 posada, 1 fuera
  const u = p.modo === 'llegando' ? 1 - clamp01(k) : clamp01(k);
  let pos: V3;
  let vuelo = 1;
  if (u > 0.22) {
    const s = (u - 0.22) / 0.78;
    pos = bezier(cerca, control(cerca, p.fuera, 2.2, 3.0), p.fuera, s);
    // aleteo errático de polilla
    const w = 0.28 * Math.sin(t * 9.1 + p.id) * (1 - Math.abs(0.5 - s));
    pos = [pos[0] + w, pos[1] + 0.22 * Math.sin(t * 7.3 + p.id * 2.1), pos[2] + 0.5 * w];
  } else {
    const s = suave(u / 0.22);
    pos = mezcla(m.pos, cerca, s);
    vuelo = s;
  }
  // dirección de vuelo (numérica) para orientar el cuerpo
  const dt = 0.02;
  const u2 = p.modo === 'llegando' ? 1 - clamp01(k + dt / p.dur) : clamp01(k + dt / p.dur);
  const sig = u2 > 0.22 ? bezier(cerca, control(cerca, p.fuera, 2.2, 3.0), p.fuera, (u2 - 0.22) / 0.78) : mezcla(m.pos, cerca, suave(u2 / 0.22));
  let dir = resta(sig, pos);
  if (Math.hypot(dir[0], dir[1], dir[2]) < 1e-5) dir = m.cabeza;
  const cabezaVuelo = normalizar([dir[0], dir[1] * 0.5, dir[2]]);
  const dorsoVuelo = ortogonal(cabezaVuelo, ARRIBA);
  const kk = suave(vuelo);
  p.pos = pos;
  p.cabeza = normalizar(mezcla(m.cabeza, cabezaVuelo, kk));
  p.dorso = ortogonal(p.cabeza, normalizar(mezcla(m.n, dorsoVuelo, kk)));
  p.ala = kk * (0.35 + 0.85 * batida);
}

// ───────────────────────────── aves ─────────────────────────────

export type ModoAve = 'percha' | 'ida' | 'agarre' | 'aferrado' | 'salto' | 'vuelta' | 'comer' | 'llega' | 'seVa' | 'fuera';

export interface AveEsc {
  /** índice de percha (0 = la del reto) */
  i: number;
  modo: ModoAve;
  t0: number; dur: number;
  a: V3; c: V3; b: V3;
  objetivo: number;
  cola: number[];
  presa: Fenotipo | null;
  capturo: boolean;
  sobrante: boolean;
  // de este cuadro
  pos: V3; adelante: V3; arriba: V3;
  /** 0 plegadas … 1 abiertas */
  alas: number;
  /** ángulo de batida (rad) */
  batida: number;
  cabezaYaw: number; cabezaPitch: number;
  presaEscala: number;
  visible: boolean;
}

function nuevaAve(i: number, t: number, llegando: boolean, rng: Rng): AveEsc {
  const per = PERCHAS[i];
  const a: AveEsc = {
    i, modo: llegando ? 'llega' : 'percha', t0: t, dur: TIEMPOS.llegaAve,
    a: llegando ? puntoFuera(rng, per[0] >= 0 ? 1 : -1) : per, c: per, b: per,
    objetivo: -1, cola: [], presa: null, capturo: false, sobrante: false,
    pos: per, adelante: [Math.sin(YAW_PERCHA[i]), 0, Math.cos(YAW_PERCHA[i])], arriba: ARRIBA,
    alas: 0, batida: 0, cabezaYaw: 0, cabezaPitch: 0, presaEscala: 1, visible: true,
  };
  if (llegando) a.c = control(a.a, per, 1.5, 1.5);
  return a;
}

/** Punto donde el ave se cierne para atrapar a la polilla (el pico la alcanza). */
function puntoCaza(p: PolillaEsc): V3 {
  const m = p.marco;
  return suma(suma(m.pos, escala(m.n, 0.74)), [0, -0.12, 0]);
}

interface Coto {
  polilla: (id: number) => PolillaEsc | undefined;
  /** hora prevista de la captura (−∞: en cuanto se pueda) */
  hora: (id: number) => number;
  capturar: (ave: AveEsc, p: PolillaEsc) => void;
  rng: Rng;
}

/** Máquina de estados de un ave: posada → vuela → se cierne y atrapa → vuelve o salta a la siguiente. */
function animarAve(a: AveEsc, t: number, dt: number, coto: Coto) {
  const per = PERCHAS[a.i];
  const iniciarVuelo = (modo: ModoAve, b: V3, dur: number, alto = 1.0, fuera = 2.2) => {
    a.modo = modo; a.t0 = t; a.dur = dur; a.a = a.pos; a.b = b; a.c = control(a.pos, b, alto, fuera);
  };
  const siguienteViva = () => {
    while (a.cola.length) {
      const p = coto.polilla(a.cola[0]);
      if (p && p.modo === 'posada') return p;
      if (p && p.modo === 'llegando') return null; // espera a que se pose
      a.cola.shift();
    }
    return null;
  };
  let adelanteMeta = a.adelante, arribaMeta: V3 = ARRIBA;
  a.visible = a.modo !== 'fuera';
  a.cabezaPitch = 0;
  switch (a.modo) {
    case 'percha': {
      a.pos = per; a.alas = 0; a.batida = 0;
      adelanteMeta = [Math.sin(YAW_PERCHA[a.i]), 0, Math.cos(YAW_PERCHA[a.i])];
      a.cabezaYaw = 0.55 * Math.sin(t * 0.9 + a.i * 2) + 0.18 * Math.sin(t * 3.1 + a.i);
      a.cabezaPitch = 0.12 * Math.sin(t * 1.7 + a.i);
      if (a.sobrante) { iniciarVuelo('seVa', puntoFuera(coto.rng, per[0] >= 0 ? 1 : -1), TIEMPOS.llegaAve, 1.5, 1.5); break; }
      const p = siguienteViva();
      if (p && t >= coto.hora(p.id) - TIEMPOS.ida) { a.objetivo = p.id; a.cola.shift(); a.capturo = false; iniciarVuelo('ida', puntoCaza(p), TIEMPOS.ida); }
      break;
    }
    case 'ida': case 'salto': case 'vuelta': case 'llega': case 'seVa': {
      const k = clamp01((t - a.t0) / a.dur);
      const e = a.modo === 'llega' || a.modo === 'seVa' ? k : suave(k);
      const pos = bezier(a.a, a.c, a.b, e);
      const d = resta(pos, a.pos);
      if (Math.hypot(d[0], d[1], d[2]) > 1e-5) adelanteMeta = normalizar([d[0], d[1] * 0.6, d[2]]);
      a.pos = pos;
      // vuelo ondulante del carbonero: ráfagas de aleteo y planeos cortos
      const fase = ((t - a.t0) * 3.2 + a.i * 0.3) % 1;
      a.alas = 1;
      a.batida = fase < 0.68 ? Math.sin((t - a.t0) * Math.PI * 2 * 11) * 0.95 : -0.35;
      if (k < 1) break;
      if (a.modo === 'ida' || a.modo === 'salto') { a.modo = 'agarre'; a.t0 = t; }
      else if (a.modo === 'vuelta') { a.modo = 'comer'; a.t0 = t; }
      else if (a.modo === 'llega') { a.modo = 'percha'; a.t0 = t; }
      else { a.modo = 'fuera'; a.visible = false; }
      break;
    }
    case 'agarre': {
      const p = coto.polilla(a.objetivo);
      const tt = t - a.t0;
      if (p) {
        const m = p.marco;
        adelanteMeta = normalizar([-m.n[0], -m.n[1] - 0.25, -m.n[2]]);
        a.pos = suma(puntoCaza(p), [0, 0.04 * Math.sin(tt * 30), 0]);
        if (!a.capturo && tt >= TIEMPOS.pico) { a.capturo = true; if (p.modo === 'posada') coto.capturar(a, p); }
      }
      a.alas = 0.85; a.batida = Math.sin(tt * Math.PI * 2 * 13) * 0.7;
      a.cabezaPitch = tt < TIEMPOS.pico ? 0.5 * (tt / TIEMPOS.pico) : 0.5 * (1 - clamp01((tt - TIEMPOS.pico) / 0.12));
      if (tt < TIEMPOS.agarre) break;
      const sig = siguienteViva();
      if (sig && !a.sobrante && coto.hora(sig.id) - t < TIEMPOS.esperaMax) { a.modo = 'aferrado'; a.t0 = t; }
      else iniciarVuelo('vuelta', per, TIEMPOS.vuelta);
      break;
    }
    case 'aferrado': {
      // agarrado a la corteza, con el cuerpo vertical, tragándose la presa
      const p = coto.polilla(a.objetivo);
      if (p) {
        const m = p.marco;
        a.pos = suma(suma(m.pos, escala(m.n, 0.34)), [0, -0.5, 0]);
        adelanteMeta = ortogonal(ARRIBA, m.n);
        adelanteMeta = normalizar(suma(adelanteMeta, escala(m.n, 0.35)));
        arribaMeta = m.n;
      }
      a.alas = 0; a.batida = 0;
      a.cabezaYaw = 0.35 * Math.sin((t - a.t0) * 4);
      const sig = siguienteViva();
      if (!sig || a.sobrante) { iniciarVuelo('vuelta', per, TIEMPOS.vuelta); break; }
      if (t >= coto.hora(sig.id) - TIEMPOS.salto) { a.objetivo = sig.id; a.cola.shift(); a.capturo = false; iniciarVuelo('salto', puntoCaza(sig), TIEMPOS.salto, 0.5, 0.9); }
      break;
    }
    case 'comer': {
      a.pos = per; a.alas = 0; a.batida = 0;
      adelanteMeta = [Math.sin(YAW_PERCHA[a.i]), 0, Math.cos(YAW_PERCHA[a.i])];
      const tt = t - a.t0;
      a.cabezaPitch = 0.3 * Math.abs(Math.sin(tt * 12));
      if (tt >= TIEMPOS.comer) { a.modo = 'percha'; a.presa = null; }
      break;
    }
    case 'fuera': break;
  }
  // la presa se traga poco a poco (aferrada o al volver a la percha)
  if (a.presa) {
    const desde = a.modo === 'comer' ? (t - a.t0) / TIEMPOS.comer : a.modo === 'aferrado' ? (t - a.t0) / 0.6 : 0;
    a.presaEscala = 1 - suave(desde);
    if (a.modo === 'aferrado' && desde >= 1) a.presa = null;
  } else a.presaEscala = 0;
  const k = 1 - Math.exp(-dt * 14);
  a.adelante = acercar(a.adelante, adelanteMeta, k);
  a.arriba = ortogonal(a.adelante, acercar(a.arriba, arribaMeta, k));
}

// ───────────────────────────── el bosque (exploración) ─────────────────────────────

export interface PuntoHistoria { g: number; p: number; conteo: Conteo; fOscuras: number }
export interface Temporada { inicial: Conteo; vivas: Conteo; cazadas: Conteo; pVivas: number; muertesPrevistas: number }

const conteoVacio = (): Conteo => ({ CC: 0, Cc: 0, cc: 0 });
const fOscurasDe = (c: Conteo) => { const n = c.CC + c.Cc + c.cc; return n ? (c.CC + c.Cc) / n : 0; };

export class RelojBosque {
  // parámetros
  hollin: number = INICIO_BOSQUE.hollin;
  aves: number = INICIO_BOSQUE.aves;
  N: number = INICIO_BOSQUE.N;
  pausa = false;
  velocidad = 1;
  // tiempo
  t = 0;
  dtPantalla = 0;
  version = 0;
  ultimoPaso = 0;
  /** duración en s de pantalla de la última generación completa */
  durGeneracion = 12;
  // población
  gen = 0;
  fase: 'dia' | 'noche' = 'dia';
  tFase = 0;
  durDia = 8;
  polillas: PolillaEsc[] = [];
  avesEsc: AveEsc[] = [];
  historia: PuntoHistoria[] = [];
  temporada: Temporada = { inicial: conteoVacio(), vivas: conteoVacio(), cazadas: conteoVacio(), pVivas: 0, muertesPrevistas: 0 };
  /** 0 de día … 1 de noche (la escena atenúa la luz) */
  noche = 0;
  pronostico: Pronostico | null = null;
  /** sube cada vez que cambia el pronóstico */
  versionPronostico = 0;
  private pronosticoEn = 0;
  private sigId = 1;
  private semilla = 1848;
  private rng: Rng;
  private inicioGen = 0;

  /** `semilla`: el bosque de partida es reproducible (la 1848 da una invasión típica de C). */
  constructor(semilla = SEMILLA_BOSQUE) {
    this.semilla = semilla;
    this.rng = rngSemilla(this.semilla);
    const gs = poblacionInicial(INICIO_BOSQUE.pC, this.N, this.rng);
    const lugares = sembrar(gs.length, this.rng);
    this.polillas = gs.map((g, i) => nuevaPolilla(this.sigId++, g, lugares[i]));
    this.historia = [this.puntoHistoria(0, gs)];
    for (let i = 0; i < this.aves; i++) this.avesEsc.push(nuevaAve(i, 0, false, this.rng));
    this.iniciarTemporada();
    this.calcularPronostico();
    // el estado inicial ya está cazando: se adelanta 1,6 s para que haya un ave en el aire
    for (let i = 0; i < 40; i++) this.avanzar(0.04);
  }

  get anio() { return INICIO_BOSQUE.anio + this.gen; }
  get pC() { return this.historia[this.historia.length - 1]?.p ?? 0; }
  get seleccion() { return seleccionDe(this.hollin, this.aves); }
  get vivas() { return this.polillas.filter((p) => p.modo === 'posada'); }

  private puntoHistoria(g: number, gs: Genotipo[]): PuntoHistoria {
    const c = conteoDe(gs);
    return { g, p: frecuenciaC(gs), conteo: c, fOscuras: fOscurasDe(c) };
  }

  private coto: Coto = {
    polilla: (id) => this.polillas.find((p) => p.id === id),
    hora: (id) => this.polillas.find((p) => p.id === id)?.tMuerte ?? Infinity,
    capturar: (ave, p) => {
      p.modo = 'presa';
      ave.presa = p.fenotipo;
      this.temporada.vivas[p.genotipo]--;
      this.temporada.cazadas[p.genotipo]++;
      this.temporada.pVivas = frecuenciaCConteo(this.temporada.vivas);
      this.version++;
    },
    rng: () => this.rng(),
  };

  // ── temporada de caza ──
  private iniciarTemporada() {
    this.fase = 'dia'; this.tFase = this.t;
    const vivas = this.polillas.filter((p) => p.modo === 'posada' || p.modo === 'llegando');
    const c = conteoDe(vivas.map((p) => p.genotipo));
    this.temporada = { inicial: { ...c }, vivas: { ...c }, cazadas: conteoVacio(), pVivas: frecuenciaCConteo(c), muertesPrevistas: 0 };
    for (const p of vivas) { p.muere = false; p.tMuerte = Infinity; p.ave = -1; }
    const muertes = this.sortearFuturo(0);
    // la temporada dura lo que necesitan las aves (≥ 7,5 s)
    const porAve = this.aves > 0 ? muertes / this.aves : 0;
    this.durDia = Math.max(7.5, porAve * 0.95 + 3);
    this.repartirTiempos(0);
  }

  /** Fracción de la temporada ya transcurrida (tiempo biológico). */
  private avanceTemporada() { return clamp01((this.t - this.tFase - 0.9) / Math.max(1, this.durDia - 2.7)); }

  /**
   * Sortea quién muere en lo que QUEDA de temporada (desde la fracción u0): riesgo restante
   * Λ·(1 − u0), con Λ = −ln v del fenotipo. Respeta las que ya están en el pico de un ave.
   */
  private sortearFuturo(u0: number): number {
    const v = viabilidadesGenotipo(this.hollin, this.aves);
    const enCurso = new Set(this.avesEsc.filter((a) => a.modo === 'ida' || a.modo === 'salto' || a.modo === 'agarre').map((a) => a.objetivo));
    let n = 0;
    for (const p of this.polillas) {
      if (p.modo !== 'posada' && p.modo !== 'llegando') continue;
      if (enCurso.has(p.id)) { n++; continue; }
      const L = -Math.log(Math.max(1e-12, v[p.genotipo])) * (1 - u0);
      const pm = 1 - Math.exp(-L);
      p.muere = L > 0 && this.rng() < pm;
      // instante de la muerte con riesgo constante (exponencial truncada)
      p.tMuerte = Infinity;
      if (p.muere) {
        const u = L > 1e-9 ? -Math.log(1 - this.rng() * pm) / L : this.rng();
        p.uMuerte = u0 + (1 - u0) * u;
        n++;
      }
    }
    this.temporada.muertesPrevistas = n + this.temporada.cazadas.CC + this.temporada.cazadas.Cc + this.temporada.cazadas.cc;
    return n;
  }

  /** Convierte la fracción de temporada de cada muerte en hora de reloj y reparte las presas entre las aves. */
  private repartirTiempos(u0: number) {
    const activas = this.avesEsc.filter((a) => !a.sobrante && a.modo !== 'seVa' && a.modo !== 'fuera');
    for (const a of activas) a.cola = [];
    const enCurso = new Set(this.avesEsc.filter((a) => a.modo === 'ida' || a.modo === 'salto' || a.modo === 'agarre').map((a) => a.objetivo));
    const presas = this.polillas.filter((p) => p.muere && (p.modo === 'posada' || p.modo === 'llegando') && !enCurso.has(p.id));
    const span = Math.max(1, this.durDia - 2.7);
    for (const p of presas) p.tMuerte = this.tFase + 0.9 + Math.max(u0, p.uMuerte) * span;
    presas.sort((x, y) => x.tMuerte - y.tMuerte);
    if (!activas.length) { for (const p of presas) p.ave = -1; return; }
    const libre = activas.map((a) => Math.max(this.t, a.modo === 'percha' ? this.t : this.t + 1));
    const ultimo: V3[] = activas.map((a) => PERCHAS[a.i]);
    for (const p of presas) {
      const m = p.marco;
      let mejor = 0, coste = Infinity;
      activas.forEach((a, k) => {
        const d = Math.hypot(...resta(m.pos, ultimo[k]));
        const c = Math.max(0, libre[k] - p.tMuerte) * 3 + d * 0.12 + a.cola.length * 0.4;
        if (c < coste) { coste = c; mejor = k; }
      });
      const a = activas[mejor];
      // cada ave necesita ~0,85 s entre presas: si va tarde, la presa espera
      p.tMuerte = Math.max(p.tMuerte, libre[mejor]);
      libre[mejor] = p.tMuerte + 0.85;
      ultimo[mejor] = m.pos;
      a.cola.push(p.id);
      p.ave = a.i;
    }
  }

  // ── noche: apareamiento y relevo ──
  private iniciarNoche() {
    const vivas = this.polillas.filter((p) => p.modo === 'posada');
    const gs = vivas.map((p) => p.genotipo);
    const pS = gs.length ? frecuenciaC(gs) : this.pC;
    const hijos = reproducir(pS, this.N, this.rng);
    this.gen++;
    this.historia.push(this.puntoHistoria(this.gen, hijos));
    this.durGeneracion = this.t - this.inicioGen;
    this.inicioGen = this.t;
    this.relevo(hijos);
  }

  /** Las supervivientes se van volando; llega la generación nueva y se posa. */
  private relevo(hijos: Genotipo[]) {
    for (const p of this.polillas) {
      if (p.modo === 'posada' || p.modo === 'llegando') {
        p.modo = 'saliendo'; p.t0 = this.t + this.rng() * 0.8; p.dur = TIEMPOS.vueloPolilla; p.fuera = puntoFuera(this.rng);
      }
    }
    this.polillas = this.polillas.filter((p) => p.modo === 'saliendo');
    const lugares = sembrar(hijos.length, this.rng);
    hijos.forEach((g, i) => {
      const p = nuevaPolilla(this.sigId++, g, lugares[i]);
      p.modo = 'llegando'; p.t0 = this.t + 1.0 + this.rng() * 1.1; p.dur = TIEMPOS.vueloPolilla; p.fuera = puntoFuera(this.rng);
      this.polillas.push(p);
    });
    for (const a of this.avesEsc) { a.cola = []; }
    this.fase = 'noche'; this.tFase = this.t;
    this.version++;
  }

  // ── controles ──
  fijar(o: { hollin?: number; aves?: number; N?: number }) {
    let cambio = false;
    if (o.hollin !== undefined && Math.abs(o.hollin - this.hollin) > 1e-6) { this.hollin = clamp01(o.hollin); cambio = true; }
    if (o.aves !== undefined && o.aves !== this.aves) {
      const n = Math.max(0, Math.min(DEPREDACION.avesMax, Math.round(o.aves)));
      this.aves = n;
      for (const a of this.avesEsc) a.sobrante = a.i >= n;
      for (let i = 0; i < n; i++) {
        const ya = this.avesEsc.find((a) => a.i === i && a.modo !== 'fuera');
        if (ya) {
          ya.sobrante = false;
          // si ya se iba, da media vuelta hacia su percha
          if (ya.modo === 'seVa') { ya.modo = 'llega'; ya.t0 = this.t; ya.dur = TIEMPOS.llegaAve; ya.a = ya.pos; ya.b = PERCHAS[i]; ya.c = control(ya.pos, PERCHAS[i], 1.5, 1.5); }
        }
        else this.avesEsc.push(nuevaAve(i, this.t, true, this.rng));
      }
      cambio = true;
    }
    if (o.N !== undefined && o.N !== this.N) { this.N = o.N; cambio = true; }
    if (!cambio) return;
    if (this.fase === 'dia') {
      const u0 = this.avanceTemporada();
      this.sortearFuturo(u0);
      this.repartirTiempos(u0);
    }
    this.pronosticoEn = this.t + 0.25;
    this.version++;
  }

  /** Población nueva con C rara (p = 0,05), con los controles actuales. */
  reiniciar() {
    this.semilla++;
    this.rng = rngSemilla(this.semilla);
    const gs = poblacionInicial(INICIO_BOSQUE.pC, this.N, this.rng);
    this.gen = 0;
    this.historia = [this.puntoHistoria(0, gs)];
    this.inicioGen = this.t;
    this.relevo(gs);
    this.calcularPronostico(conteoDe(gs));
    this.version++;
  }

  private calcularPronostico(inicio?: Conteo) {
    const c = inicio ?? this.historia[this.historia.length - 1].conteo;
    this.pronostico = pronosticar({
      inicio: c, v: viabilidadesGenotipo(this.hollin, this.aves), N: this.N, g0: this.gen,
      horizonte: 120, replicas: 240, semilla: 4242 + this.gen,
    });
    this.versionPronostico++;
    this.pronosticoEn = 0;
  }

  // ── el paso ──
  private avanzar(d: number) {
    this.t += d;
    if (this.pronosticoEn && this.t >= this.pronosticoEn) this.calcularPronostico();
    const tf = this.t - this.tFase;
    if (this.fase === 'noche') {
      this.noche = PENUMBRA * suave(tf / 0.8) * (1 - suave((tf - 2.7) / 0.9));
      const aterrizadas = this.polillas.every((p) => p.modo !== 'llegando' || this.t >= p.t0 + p.dur);
      for (const p of this.polillas) if (p.modo === 'llegando' && this.t >= p.t0 + p.dur) p.modo = 'posada';
      if (tf >= TIEMPOS.noche && aterrizadas) {
        this.polillas = this.polillas.filter((p) => p.modo !== 'saliendo');
        this.noche = 0;
        this.iniciarTemporada();
      }
    } else {
      this.noche = 0;
      const pendientes = this.polillas.some((p) => p.muere && p.modo === 'posada');
      const ocupadas = this.avesEsc.some((a) => a.modo === 'ida' || a.modo === 'salto' || a.modo === 'agarre' || a.modo === 'aferrado');
      // seguro: si las aves no alcanzan (o no hay aves), las presas pendientes no se salvan
      if (pendientes && tf > this.durDia + 20) {
        for (const p of this.polillas) if (p.muere && p.modo === 'posada') { p.modo = 'comida'; this.temporada.vivas[p.genotipo]--; this.temporada.cazadas[p.genotipo]++; }
      }
      if (tf >= this.durDia && !pendientes && !ocupadas) this.iniciarNoche();
    }
    for (const p of this.polillas) animarPolilla(p, this.t);
    for (const a of this.avesEsc) animarAve(a, this.t, d, this.coto);
    this.avesEsc = this.avesEsc.filter((a) => a.modo !== 'fuera');
  }

  paso(dtPantalla: number, ahora = 0) {
    if (!(dtPantalla > 0)) return;
    this.ultimoPaso = ahora;
    const d = Math.min(dtPantalla, 0.1) * this.velocidad;
    this.dtPantalla = this.pausa ? 0 : d;
    if (!this.pausa) {
      // a ×4 se integra en subpasos para que ningún vuelo se salte su final
      const n = Math.ceil(d / 0.034);
      for (let i = 0; i < n; i++) this.avanzar(d / n);
    }
    this.version++;
  }
}

// ───────────────────────────── el reto ─────────────────────────────

export interface BugReto { id: number; genotipo: Genotipo; tipo: Fenotipo; x: number; y: number; angle: number; cazada: boolean }

export class RelojReto {
  hollin: number = HOLLIN_RETO.industrial;
  pausa = false;
  t = 0;
  dtPantalla = 0;
  version = 0;
  ultimoPaso = 0;
  noche = 0;
  polillas: PolillaEsc[] = [];
  avesEsc: AveEsc[] = [];
  private tNoche = -1e9;
  private encoladas = new Set<number>();
  private ids = '';
  private rng = rngSemilla(606);

  constructor() {
    this.avesEsc = [nuevaAve(0, 0, false, this.rng)];
  }

  private coto: Coto = {
    polilla: (id) => this.polillas.find((p) => p.id === id && p.modo !== 'saliendo'),
    hora: () => -Infinity,
    capturar: (ave, p) => { p.modo = 'presa'; ave.presa = p.fenotipo; this.version++; },
    rng: () => this.rng(),
  };

  /** Copia el estado del store: polillas nuevas, relevo de generación y capturas pendientes. */
  sincronizar(bugs: readonly BugReto[], ambiente: 'industrial' | 'limpio') {
    this.hollin = HOLLIN_RETO[ambiente];
    const ids = bugs.map((b) => b.id).join(',');
    if (ids !== this.ids) {
      const primera = this.ids === '';
      this.ids = ids;
      this.encoladas.clear();
      const ave = this.avesEsc[0];
      ave.cola = [];
      if (ave.modo === 'ida' || ave.modo === 'salto' || ave.modo === 'agarre' || ave.modo === 'aferrado') {
        ave.modo = 'vuelta'; ave.t0 = this.t; ave.dur = TIEMPOS.vuelta; ave.a = ave.pos; ave.b = PERCHAS[0]; ave.c = control(ave.pos, PERCHAS[0]);
      }
      if (primera) {
        this.polillas = bugs.map((b) => nuevaPolilla(b.id, b.genotipo, lugarDelStore(b.x, b.y, b.angle)));
      } else {
        for (const p of this.polillas) if (p.modo === 'posada' || p.modo === 'llegando') { p.modo = 'saliendo'; p.t0 = this.t + this.rng() * 0.7; p.dur = TIEMPOS.vueloPolilla; p.fuera = puntoFuera(this.rng); }
        this.polillas = this.polillas.filter((p) => p.modo === 'saliendo');
        for (const b of bugs) {
          const p = nuevaPolilla(b.id, b.genotipo, lugarDelStore(b.x, b.y, b.angle));
          p.modo = 'llegando'; p.t0 = this.t + 0.9 + this.rng() * 1.0; p.dur = TIEMPOS.vueloPolilla; p.fuera = puntoFuera(this.rng);
          this.polillas.push(p);
        }
        this.tNoche = this.t;
      }
      // las que ya venían cazadas (al volver a la vista) no se vuelven a cazar: desaparecen
      for (const b of bugs) if (b.cazada) { const p = this.polillas.find((q) => q.id === b.id && q.modo !== 'saliendo'); if (p) { p.modo = 'comida'; this.encoladas.add(b.id); } }
      this.version++;
    }
    for (const b of bugs) {
      if (!b.cazada || this.encoladas.has(b.id)) continue;
      this.encoladas.add(b.id);
      this.avesEsc[0].cola.push(b.id);
      const p = this.polillas.find((q) => q.id === b.id && q.modo !== 'saliendo');
      if (p) p.marcada = true;
    }
  }

  paso(dtPantalla: number, ahora = 0) {
    if (!(dtPantalla > 0)) return;
    this.ultimoPaso = ahora;
    const d = Math.min(dtPantalla, 0.1);
    this.dtPantalla = this.pausa ? 0 : d;
    if (!this.pausa) {
      const n = Math.ceil(d / 0.034);
      for (let i = 0; i < n; i++) {
        this.t += d / n;
        const tf = this.t - this.tNoche;
        this.noche = tf < TIEMPOS.noche + 1 ? PENUMBRA * suave(tf / 0.8) * (1 - suave((tf - 2.5) / 0.9)) : 0;
        for (const p of this.polillas) {
          if (p.modo === 'llegando' && this.t >= p.t0 + p.dur) p.modo = 'posada';
          animarPolilla(p, this.t);
        }
        if (tf > TIEMPOS.noche) this.polillas = this.polillas.filter((p) => !(p.modo === 'saliendo' && this.t >= p.t0 + p.dur));
        // el ave del reto caza en cuanto puede (y espera a que la nueva generación se pose)
        for (const a of this.avesEsc) animarAve(a, this.t, d / n, this.coto);
      }
    }
    this.version++;
  }
}
