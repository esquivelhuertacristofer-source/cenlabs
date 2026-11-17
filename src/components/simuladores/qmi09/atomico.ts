/**
 * qmi09/atomico.ts — la «lupa atómica» de la celda de Daniell (módulo puro, sin three ni React).
 *
 * Un recuadro de la interfaz de cada electrodo, a escala de átomos, movido por la MISMA
 * lectura del reloj de la celda (reloj.ts):
 *
 *   · ÁNODO (izq.): red de átomos de Zn. Cada oxidación arranca un átomo de la superficie,
 *     que sale como Zn²⁺ y se rodea de 6 aguas (Zn(H₂O)₆²⁺), y suelta 2 e⁻ en el metal.
 *   · Los 2 e⁻ suben por el electrodo, cruzan el cable y bajan por el cobre.
 *   · CÁTODO (der.): el Cu²⁺(aq) más cercano se acerca, suelta sus 6 aguas y, cuando le
 *     llegan los 2 e⁻, queda como átomo de Cu sobre la red (el depósito crece).
 *   · PUENTE: por cada 2 e⁻ entran ≈ 2·t₊ K⁺ al vaso del cátodo y 2·t₋ NO₃⁻ al del ánodo.
 *   · SO₄²⁻ y agua libre con agitación térmica (paseo aleatorio esquemático).
 *
 * RITMO HONESTO: la pila real hace |I|/(2e) reacciones por segundo (≈ 2,4·10¹⁵ con
 * 0,78 mA). Aquí se ven `ritmoVisible(I)` por segundo, monótono en |I|; con el circuito
 * abierto o la celda agotada no hay ninguna. El número de iones de cada lado sigue la
 * concentración del modelo con `ionesPorConcentracion` (esquemático, logarítmico).
 *
 * Unidades: 1 u ≈ radio de un átomo metálico (≈ 0,13 nm). +X va del ánodo al cátodo.
 */
import { CARGA_E, T_POTASIO } from './electroquimica';

export type V3 = [number, number, number];

// ───────────────────────────── geometría del recuadro ─────────────────────────────

export const GEO = {
  /** superficie del Zn (mira a +X) y del Cu (mira a −X) */
  xZn: -24, xCu: 24,
  /** separación entre capas de la red y entre átomos de una capa */
  capa: 1.75, paso: 2,
  filas: 11, columnas: 7, capas: 3,
  /** caja de cada disolución */
  y: [-10, 10] as [number, number], z: [-6, 6] as [number, number],
  xAnodo: [-21.8, -4.2] as [number, number], xCatodo: [4.2, 21.8] as [number, number],
  /** media anchura del puente salino (centrado en x = 0) */
  puente: 3,
  /** cable: sale de lo alto de cada electrodo */
  yCable: 10.8, xHilo: 27.5,
  /** distancia ion–oxígeno de la capa de hidratación */
  rHidratacion: 2.05,
} as const;

/** Catmull-Rom centrípeta-uniforme por los puntos de control (sin dependencias). */
function catmullRom(ctrl: V3[], porTramo: number): V3[] {
  const out: V3[] = [];
  const P = (i: number) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))];
  for (let i = 0; i < ctrl.length - 1; i++) {
    for (let k = 0; k < porTramo; k++) {
      const t = k / porTramo, t2 = t * t, t3 = t2 * t;
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      out.push([0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)) as V3);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/** El cable que une lo alto de los dos electrodos (lo dibuja la vista y lo recorren los e⁻). */
export const CABLE: V3[] = catmullRom([
  [-GEO.xHilo, GEO.yCable, 0], [-GEO.xHilo, GEO.yCable + 5, 0], [-17, GEO.yCable + 10, 0],
  [17, GEO.yCable + 10, 0], [GEO.xHilo, GEO.yCable + 5, 0], [GEO.xHilo, GEO.yCable, 0],
], 10);

/** Las 6 direcciones (octaedro) de las aguas de hidratación. */
export const OCTAEDRO: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/** Posición de un sitio de la red. capa 0 = superficie; capas negativas = depósito hacia la disolución. */
export function sitio(lado: 'Zn' | 'Cu', capa: number, fila: number, col: number): V3 {
  const s = lado === 'Zn' ? -1 : 1;
  const off = ((capa % 2) + 2) % 2;
  return [
    (lado === 'Zn' ? GEO.xZn : GEO.xCu) + s * capa * GEO.capa,
    GEO.y[0] + fila * GEO.paso + off,
    GEO.z[0] + col * GEO.paso + off,
  ];
}

// ───────────────────────────── ritmo y recuentos ─────────────────────────────

/** Reacciones por segundo que hace la pila real (Zn + Cu²⁺ → Zn²⁺ + Cu: 2 e⁻ por reacción). */
export const reaccionesReales = (I: number) => Math.abs(I) / (2 * CARGA_E);

/**
 * Reacciones por segundo de pantalla: 0 sin corriente; si no, crece con log|I|
 * (10 µA → 0,4/s · 1 mA → 1,5/s · 10 mA → 2,1/s), acotado para poder seguirlas con la vista.
 */
export function ritmoVisible(I: number): number {
  const a = Math.abs(I);
  if (!(a > 1e-7)) return 0;
  return Math.min(2.6, Math.max(0.25, 0.4 + 0.55 * Math.log10(a / 1e-5)));
}

/** Iones visibles para una concentración (M): 1 mM → 3 · 10 mM → 8 · 0,1 M → 12 · 1 M → 17 (máx. 18). */
export function ionesPorConcentracion(c: number): number {
  if (!(c > 0)) return 0;
  return Math.max(1, Math.min(18, Math.round(3 + 4.5 * Math.log10(c / 1e-3))));
}

// ───────────────────────────── el mundo ─────────────────────────────

export type Especie = 'Zn2' | 'Cu2' | 'SO4' | 'K' | 'NO3' | 'H2O';
export type FaseIon = 'libre' | 'sale' | 'llega' | 'entra' | 'se-va';

export interface Particula {
  id: number;
  especie: Especie;
  lado: 'an' | 'ca';
  p: V3;
  v: V3;
  /** orientación (cuaternión x, y, z, w) y su giro lento */
  q: [number, number, number, number];
  w: V3;
  fase: FaseIon;
  /** 0…1 dentro de la fase */
  t: number;
  /** escala de aparición (0…1) */
  escala: number;
  /** capa de hidratación visible (0…1); sólo Zn²⁺ y Cu²⁺ */
  capa: number;
  /** destino (llegada al cátodo) y duración de la fase */
  meta?: V3;
  dur?: number;
  /** sitio del cátodo reservado para este ion */
  hueco?: number;
}

export interface Electron { id: number; ruta: V3[]; largos: number[]; s: number; hacia: number }

export interface Destello { p: V3; t: number; color: 'Zn' | 'Cu' }

/** Generador determinista. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const VEL_E = 34; // u/s de pantalla de los electrones

export interface EntradaMundo {
  /** A (con signo); se usa |I| */
  I: number;
  cerrado: boolean;
  /** concentraciones actuales del modelo (M) */
  cAn: number;
  cCa: number;
  /** concentraciones con que se prepararon (fijan el SO₄²⁻) */
  c0An: number;
  c0Ca: number;
}

export class MundoAtomico {
  rnd = azar(424242);
  /** red de Zn: vivo (1) / arrancado (0); índice = (capa·filas + fila)·columnas + col */
  zn: Uint8Array;
  /** escala de aparición de cada átomo de Zn (al reponer una columna) */
  znEscala: Float32Array;
  /** depósito de Cu: 2 capas hacia la disolución; 0 libre, 1 reservado, 2 ocupado */
  cu: Uint8Array;
  cuEscala: Float32Array;
  particulas: Particula[] = [];
  electrones: Electron[] = [];
  destellos: Destello[] = [];
  private sig = 1;
  private acumulado = 0;
  private acK = 0;
  private acN = 0;
  /** reacciones completas (un átomo de Cu depositado por cada una) */
  reacciones = 0;
  /** oxidaciones iniciadas (átomos de Zn arrancados) */
  oxidaciones = 0;
  /** electrones emitidos y recibidos (comprobación: 2 por reacción) */
  eEmitidos = 0;
  eRecibidos = 0;

  constructor(e: EntradaMundo) {
    const n = GEO.capas * GEO.filas * GEO.columnas;
    this.zn = new Uint8Array(n).fill(1);
    this.znEscala = new Float32Array(n).fill(1);
    this.cu = new Uint8Array(2 * GEO.filas * GEO.columnas);
    this.cuEscala = new Float32Array(2 * GEO.filas * GEO.columnas);
    this.poblar(e);
  }

  private nueva(especie: Especie, lado: 'an' | 'ca', p: V3, fase: FaseIon = 'libre'): Particula {
    const r = this.rnd;
    const q = normalizar4([r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5]);
    const part: Particula = {
      id: this.sig++, especie, lado, p, v: [0, 0, 0], q, w: [(r() - 0.5) * 1.2, (r() - 0.5) * 1.2, (r() - 0.5) * 1.2],
      fase, t: 0, escala: fase === 'libre' ? 1 : 0, capa: especie === 'Zn2' || especie === 'Cu2' ? 1 : 0,
    };
    this.particulas.push(part);
    return part;
  }

  private puntoLibre(lado: 'an' | 'ca'): V3 {
    const r = this.rnd, xr = lado === 'an' ? GEO.xAnodo : GEO.xCatodo;
    return [xr[0] + 1 + r() * (xr[1] - xr[0] - 2), GEO.y[0] + 1 + r() * (GEO.y[1] - GEO.y[0] - 2), GEO.z[0] + 1 + r() * (GEO.z[1] - GEO.z[0] - 2)];
  }

  private poblar(e: EntradaMundo) {
    for (let i = 0; i < ionesPorConcentracion(e.cAn); i++) this.nueva('Zn2', 'an', this.puntoLibre('an'));
    for (let i = 0; i < ionesPorConcentracion(e.cCa); i++) this.nueva('Cu2', 'ca', this.puntoLibre('ca'));
    for (let i = 0; i < ionesPorConcentracion(e.c0An); i++) this.nueva('SO4', 'an', this.puntoLibre('an'));
    for (let i = 0; i < ionesPorConcentracion(e.c0Ca); i++) this.nueva('SO4', 'ca', this.puntoLibre('ca'));
    for (let i = 0; i < 14; i++) { this.nueva('H2O', 'an', this.puntoLibre('an')); this.nueva('H2O', 'ca', this.puntoLibre('ca')); }
  }

  cuenta(especie: Especie, lado: 'an' | 'ca', soloLibres = false): number {
    let n = 0;
    for (const p of this.particulas) if (p.especie === especie && p.lado === lado && p.fase !== 'se-va' && (!soloLibres || p.fase === 'libre')) n++;
    return n;
  }

  /** Átomos de Zn vivos (para pruebas). */
  atomosZn(): number { let n = 0; for (const x of this.zn) n += x; return n; }
  atomosCuDepositados(): number { let n = 0; for (const x of this.cu) if (x === 2) n++; return n; }

  // ── una reacción: Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s) ──

  private idxZn(capa: number, fila: number, col: number) { return (capa * GEO.filas + fila) * GEO.columnas + col; }
  private idxCu(capa: number, fila: number, col: number) { return (capa * GEO.filas + fila) * GEO.columnas + col; }

  /** Sitio de Zn de la superficie que se oxida: el átomo más externo de una columna al azar. */
  private elegirZn(): { capa: number; fila: number; col: number } | null {
    const r = this.rnd;
    for (let intento = 0; intento < 60; intento++) {
      const fila = 1 + Math.floor(r() * (GEO.filas - 2)), col = 1 + Math.floor(r() * (GEO.columnas - 2));
      for (let capa = 0; capa < GEO.capas; capa++) if (this.zn[this.idxZn(capa, fila, col)]) return { capa, fila, col };
    }
    return null;
  }

  /** Hueco del depósito de Cu: primero la capa −1 (pegada a la red), luego la −2. */
  private elegirHuecoCu(): number {
    const r = this.rnd;
    for (const capa of [0, 1]) {
      const libres: number[] = [];
      for (let fila = 1; fila < GEO.filas - 1; fila++) for (let col = 1; col < GEO.columnas - 1; col++) {
        const i = this.idxCu(capa, fila, col);
        // la capa −2 sólo se apoya sobre un átomo de la −1 ya depositado
        if (this.cu[i] === 0 && (capa === 0 || this.cu[this.idxCu(0, fila, col)] === 2)) libres.push(i);
      }
      if (libres.length) return libres[Math.floor(r() * libres.length)];
    }
    // depósito lleno: el recuadro «sigue» a la superficie y vuelve a empezar
    this.cu.fill(0); this.cuEscala.fill(0);
    return this.elegirHuecoCu();
  }

  posHuecoCu(i: number): V3 {
    const capa = Math.floor(i / (GEO.filas * GEO.columnas)), resto = i % (GEO.filas * GEO.columnas);
    return sitio('Cu', -(capa + 1), Math.floor(resto / GEO.columnas), resto % GEO.columnas);
  }

  private reaccion() {
    const z = this.elegirZn();
    if (!z) return;
    const pZn = sitio('Zn', z.capa, z.fila, z.col);
    this.zn[this.idxZn(z.capa, z.fila, z.col)] = 0;
    this.oxidaciones++;
    // el Zn²⁺ sale de la superficie y se hidrata
    const ion = this.nueva('Zn2', 'an', [pZn[0], pZn[1], pZn[2]], 'sale');
    ion.capa = 0; ion.escala = 1; ion.dur = 1.6;
    ion.v = [9, (this.rnd() - 0.5) * 1.5, (this.rnd() - 0.5) * 1.5];
    this.destellos.push({ p: pZn, t: 0, color: 'Zn' });
    // el Cu²⁺ que recibirá los electrones
    const hueco = this.elegirHuecoCu();
    this.cu[hueco] = 1;
    const meta = this.posHuecoCu(hueco);
    let cu: Particula | undefined;
    let dMin = Infinity;
    for (const p of this.particulas) {
      if (p.especie !== 'Cu2' || p.fase !== 'libre') continue;
      const d = Math.hypot(p.p[0] - meta[0], p.p[1] - meta[1], p.p[2] - meta[2]);
      if (d < dMin) { dMin = d; cu = p; }
    }
    if (!cu) cu = this.nueva('Cu2', 'ca', this.puntoLibre('ca'), 'libre');
    // los dos electrones: por el metal, el cable y el cobre hasta el hueco
    const ruta: V3[] = [
      pZn, [GEO.xZn - 3, pZn[1], pZn[2] * 0.5], ...CABLE, [GEO.xCu + 3, meta[1], meta[2] * 0.5], meta,
    ];
    const largos = [0];
    for (let i = 1; i < ruta.length; i++) largos.push(largos[i - 1] + Math.hypot(ruta[i][0] - ruta[i - 1][0], ruta[i][1] - ruta[i - 1][1], ruta[i][2] - ruta[i - 1][2]));
    for (let k = 0; k < 2; k++) {
      this.electrones.push({ id: this.sig++, ruta, largos, s: -k * 2.2, hacia: cu.id });
      this.eEmitidos++;
    }
    const tViaje = largos[largos.length - 1] / VEL_E;
    cu.fase = 'llega'; cu.t = 0; cu.meta = meta; cu.hueco = hueco;
    cu.dur = Math.max(1.4, tViaje + 2.2 / VEL_E);
    cu.v = [cu.p[0], cu.p[1], cu.p[2]]; // origen del viaje (se guarda en v)
    // el puente compensa las cargas: 2·t₊ K⁺ al cátodo, 2·t₋ NO₃⁻ al ánodo
    this.acK += 2 * T_POTASIO; this.acN += 2 * (1 - T_POTASIO);
    while (this.acK >= 1) { this.acK -= 1; this.nueva('K', 'ca', [GEO.puente - 0.2, (this.rnd() - 0.5) * 12, (this.rnd() - 0.5) * 8], 'entra').v = [3, 0, 0]; }
    while (this.acN >= 1) { this.acN -= 1; this.nueva('NO3', 'an', [-GEO.puente + 0.2, (this.rnd() - 0.5) * 12, (this.rnd() - 0.5) * 8], 'entra').v = [-3, 0, 0]; }
  }

  /** Repone una columna de Zn agotada (el recuadro sigue a la superficie que retrocede). */
  private reponerZn() {
    for (let fila = 0; fila < GEO.filas; fila++) for (let col = 0; col < GEO.columnas; col++) {
      let vivos = 0;
      for (let capa = 0; capa < GEO.capas; capa++) vivos += this.zn[this.idxZn(capa, fila, col)];
      if (vivos === 0) for (let capa = 0; capa < GEO.capas; capa++) { const i = this.idxZn(capa, fila, col); this.zn[i] = 1; this.znEscala[i] = 0; }
    }
  }

  // ── el cuadro ──

  paso(dt: number, e: EntradaMundo) {
    if (!(dt > 0)) return;
    dt = Math.min(dt, 0.05);
    const r = this.rnd;
    // reacciones al ritmo visible de la corriente real
    const ritmo = e.cerrado ? ritmoVisible(e.I) : 0;
    this.acumulado += ritmo * dt;
    if (ritmo === 0) this.acumulado = 0;
    while (this.acumulado >= 1) { this.acumulado -= 1; this.reaccion(); }
    this.reponerZn();
    for (let i = 0; i < this.znEscala.length; i++) if (this.znEscala[i] < 1) this.znEscala[i] = Math.min(1, this.znEscala[i] + dt / 0.8);
    for (let i = 0; i < this.cuEscala.length; i++) if (this.cu[i] === 2 && this.cuEscala[i] < 1) this.cuEscala[i] = Math.min(1, this.cuEscala[i] + dt / 0.35);

    // electrones
    for (const el of this.electrones) el.s += VEL_E * dt;
    const llegados = this.electrones.filter((el) => el.s >= el.largos[el.largos.length - 1]);
    this.eRecibidos += llegados.length;
    this.electrones = this.electrones.filter((el) => el.s < el.largos[el.largos.length - 1]);

    // partículas
    const fuera: Particula[] = [];
    for (const p of this.particulas) {
      // giro lento
      p.q = girar(p.q, p.w, dt);
      if (p.fase === 'sale') {
        p.t += dt / (p.dur ?? 1.6);
        p.capa = Math.min(1, p.t * 1.4);
        for (let c = 0; c < 3; c++) { p.p[c] += p.v[c] * dt; p.v[c] *= Math.exp(-1.8 * dt); }
        if (p.t >= 1) p.fase = 'libre';
      } else if (p.fase === 'llega' && p.meta) {
        p.t += dt / (p.dur ?? 1.6);
        const u = Math.min(1, p.t), k = u * u * (3 - 2 * u);
        for (let c = 0; c < 3; c++) p.p[c] = p.v[c] + (p.meta[c] - p.v[c]) * k;
        // al tocar la superficie se desprende de sus aguas
        if (u > 0.72 && p.capa === 1) this.soltarAguas(p);
        p.capa = u > 0.72 ? 0 : 1;
        if (u >= 1) {
          // los 2 e⁻ llegaron: Cu²⁺ + 2e⁻ → Cu(s)
          if (p.hueco !== undefined) { this.cu[p.hueco] = 2; this.cuEscala[p.hueco] = 0.6; }
          this.destellos.push({ p: p.meta, t: 0, color: 'Cu' });
          this.reacciones++;
          fuera.push(p);
        }
      } else if (p.fase === 'entra') {
        p.t += dt / 1.4;
        p.escala = Math.min(1, p.t * 2);
        for (let c = 0; c < 3; c++) p.p[c] += p.v[c] * dt;
        if (p.t >= 1) { p.fase = 'libre'; p.v = [0, 0, 0]; }
      } else if (p.fase === 'se-va') {
        p.escala -= dt / 0.7;
        if (p.escala <= 0) fuera.push(p);
      } else {
        if (p.escala < 1) p.escala = Math.min(1, p.escala + dt / 0.8);
      }
      if (p.fase === 'libre' || p.fase === 'se-va') {
        // agitación térmica (esquemática), amortiguada
        const sig = p.especie === 'H2O' ? 3.2 : 1.8, gam = 1.4;
        for (let c = 0; c < 3; c++) { p.v[c] = p.v[c] * Math.exp(-gam * dt) + (r() - 0.5) * sig * Math.sqrt(dt) * 2; p.p[c] += p.v[c] * dt; }
      }
      if (p.fase !== 'llega') confinar(p);
    }
    if (fuera.length) this.particulas = this.particulas.filter((p) => !fuera.includes(p));

    // los recuentos siguen la concentración del modelo
    this.equilibrar('Zn2', 'an', ionesPorConcentracion(e.cAn));
    this.equilibrar('Cu2', 'ca', ionesPorConcentracion(e.cCa));
    this.equilibrar('K', 'ca', 8);
    this.equilibrar('NO3', 'an', 8);
    this.equilibrar('H2O', 'an', 14, true);
    this.equilibrar('H2O', 'ca', 14, true);

    for (const d of this.destellos) d.t += dt / 0.6;
    this.destellos = this.destellos.filter((d) => d.t < 1);
  }

  /** Sólo quita lo que sobra (o añade lo que falta) entre las partículas libres. */
  private equilibrar(especie: Especie, lado: 'an' | 'ca', objetivo: number, soloQuitar = false) {
    const libres = this.particulas.filter((p) => p.especie === especie && p.lado === lado && p.fase === 'libre');
    const vivas = this.cuenta(especie, lado);
    if (vivas > objetivo + 1 && libres.length) {
      // se va la más lejana a la interfaz (sale del recuadro hacia el resto de la disolución)
      libres.sort((a, b) => Math.abs(a.p[0]) - Math.abs(b.p[0]));
      libres[0].fase = 'se-va';
    } else if (!soloQuitar && vivas < objetivo) {
      const xr = lado === 'an' ? GEO.xAnodo : GEO.xCatodo;
      const x = lado === 'an' ? xr[1] - 1.5 : xr[0] + 1.5;
      this.nueva(especie, lado, [x, (this.rnd() - 0.5) * 16, GEO.z[0] + 0.5], 'libre').escala = 0;
    }
  }

  private soltarAguas(p: Particula) {
    for (const d of OCTAEDRO) {
      const o = rotar(p.q, d);
      const w = this.nueva('H2O', p.lado, [p.p[0] + o[0] * GEO.rHidratacion, p.p[1] + o[1] * GEO.rHidratacion, p.p[2] + o[2] * GEO.rHidratacion]);
      w.v = [o[0] * 4, o[1] * 4, o[2] * 4];
    }
  }
}

function confinar(p: Particula) {
  const xr = p.lado === 'an' ? GEO.xAnodo : GEO.xCatodo;
  const m = p.especie === 'Zn2' || p.especie === 'Cu2' ? 2.2 : 1;
  const lim: [number, number][] = [[xr[0] + m, xr[1] - m * 0.5], [GEO.y[0] + m, GEO.y[1] - m], [GEO.z[0] + m * 0.5, GEO.z[1] - m * 0.5]];
  // el ion que sale de la red empieza pegado a ella: no lo empujes hasta que se separe
  if (p.fase === 'sale') lim[0][0] = GEO.xZn;
  // K⁺ y NO₃⁻ que entran desde el puente cruzan su borde hasta quedar libres
  if (p.fase === 'entra') { if (p.lado === 'ca') lim[0][0] = 0; else lim[0][1] = 0; }
  for (let c = 0; c < 3; c++) {
    if (p.p[c] < lim[c][0]) { p.p[c] = lim[c][0]; p.v[c] = Math.abs(p.v[c]) * 0.5; }
    if (p.p[c] > lim[c][1]) { p.p[c] = lim[c][1]; p.v[c] = -Math.abs(p.v[c]) * 0.5; }
  }
}

// ───────────────────────────── cuaterniones mínimos ─────────────────────────────

function normalizar4(q: [number, number, number, number]): [number, number, number, number] {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

function girar(q: [number, number, number, number], w: V3, dt: number): [number, number, number, number] {
  const [x, y, z, s] = q, h = dt / 2;
  return normalizar4([
    x + h * (w[0] * s + w[1] * z - w[2] * y),
    y + h * (w[1] * s + w[2] * x - w[0] * z),
    z + h * (w[2] * s + w[0] * y - w[1] * x),
    s - h * (w[0] * x + w[1] * y + w[2] * z),
  ]);
}

/** Rota el vector v con el cuaternión q. */
export function rotar(q: [number, number, number, number], v: V3): V3 {
  const [x, y, z, w] = q;
  const ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}

/** Punto de la ruta de un electrón a la distancia s (antes de salir: en el origen). */
export function puntoRuta(el: Electron): V3 {
  const s = Math.max(0, el.s);
  for (let i = 1; i < el.ruta.length; i++) {
    if (s <= el.largos[i]) {
      const a = el.ruta[i - 1], b = el.ruta[i], f = (s - el.largos[i - 1]) / Math.max(1e-9, el.largos[i] - el.largos[i - 1]);
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
  }
  return el.ruta[el.ruta.length - 1];
}
