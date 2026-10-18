/**
 * qmi10/reloj.ts — EL RELOJ ÚNICO de la destilación (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar). En ese paso:
 *   · EXPLORACIÓN: la columna con retención (`ColumnaDinamica`) avanza `dt·factor` segundos
 *     simulados (cámara rápida ×20 o ×100, rotulada); el receptor recoge D·v_molar(x_D);
 *   · RETO: no integra nada propio: la columna es la del store (`pasoDestilacion` del dominio,
 *     sin cambios) y su perfil sale de `perfilReto`; aquí sólo se animan el llenado de los
 *     platos al arrancar el hervor y su vaciado al pararlo;
 *   · el divisor de reflujo bascula su embudo con R = t_retorno/t_toma (reloj visual) y cada
 *     gota de condensado se va a la columna o al receptor según dónde esté el embudo;
 *   · la escalera de McCabe–Thiele del dock se redibuja etapa a etapa y la escena ilumina el
 *     plato que se está dibujando.
 * El dock, la barra de lecturas y la escena leen este mismo objeto (comparan `version`).
 *
 * Las burbujas y las gotas son una MUESTRA ilustrativa: su frecuencia es proporcional al caudal
 * real, pero no se integran en cámara rápida (a ×20 serían un borrón).
 */
import {
  MEZCLAS, ColumnaDinamica, flujos, volumenMolar, perfilReto, reflujoMinimo, underwood, fenske, N_PLATOS, ETAPAS, Q_MAX, R_MAX,
  type IdMezcla, type Mezcla, type Operacion, type Flujos, type PerfilReto,
} from './columna';
import { tBurbuja, yEquilibrio, fraccionMolarDesdeVolumenes } from '@/domain/quimica';
import {
  COL, yPlato, PUNTA_CONDENSADOR, EMBUDO, PUNTA_TOMA, ySuperficieReceptor, ySuperficieBalon, CABEZA, BALON, type V3,
} from './cotas';

export type ModoQ10 = 'explorar' | 'reto';

/** Lo que el reloj necesita del store (`destilacion`). */
export interface DatosReto {
  calorManta: number; tempMezcla: number; tempCabeza: number; tasa: number;
  volEtanolMatraz: number; volAguaMatraz: number; volDestilado: number; volEtanolDest: number; purezaDestilado: number;
  status: string;
}

/** Estado que dibujan la escena y el dock (índices de etapa: 0 = cabeza, 1..N = platos, N + 1 = hervidor). */
export interface Vista {
  x: number[];
  y: number[];
  T: number[];
  /** llenado de cada etapa (0–1): los platos del reto se llenan al hervir */
  nivel: number[];
  /** caudal de vapor normalizado (0–1) */
  vapor: number;
  hervidor: { mL: number; x: number; hierve: boolean; calor: number; T: number };
  receptor: { mL: number; x: number };
  tCabeza: number;
  alimentando: boolean;
  z: number;
  /** relación de reflujo del divisor (Infinity = total) */
  R: number;
  /** posición del embudo: 0 = retorno a la columna, 1 = toma al receptor */
  embudo: number;
}

export interface Gota { p: V3; vy: number; x: number; yFin: number; tipo: 'cond' | 'reflujo' | 'toma' | 'alim' | 'fondo' }
export interface PuntoHistoria { v: number; T: number }

/** Divisor del reto: el modelo del dominio aproxima reflujo total; el embudo trabaja fijo en 4 : 1. */
export const R_RETO = 4;
/** Tiempo de toma de un ciclo del divisor (s, visual): el retorno dura R veces más. */
export const T_TOMA = 0.55;
/** Ritmo de la escalera del dock (etapas por segundo) y pausa al completarla (s). */
const ETAPAS_POR_S = 1.6;
const PAUSA_ESCALERA = 2.6;
const G_U = 98.0665; // g en u/s² (1 u = 10 cm)
const MAX_GOTAS = 40;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Generador determinista (capturas repetibles). */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Lo que la exploración muestra como referencia (no hay incógnita que proteger). */
export interface Referencias { Rmin: number; xPellizco: number; Nmin: number | null; underwood: number | null }

export class RelojDestilacion {
  modo: ModoQ10 = 'explorar';
  mezcla: Mezcla;
  op: Operacion;
  col: ColumnaDinamica;
  fl: Flujos;
  /** cámara rápida de la composición (exploración) */
  factor = 20;
  pausa = false;
  /** prefers-reduced-motion: sin burbujas, gotas ni embudo oscilante; la escalera, entera */
  reducido = false;
  /** tiempo visual (s reales) */
  tv = 0;
  version = 0;
  /** sube al cambiar de mezcla o reiniciar (la escena y el dock limpian lo suyo) */
  generacion = 0;
  vista: Vista;
  gotas: Gota[] = [];
  /** fase acumulada de las burbujas (las mueve el caudal de vapor) */
  faseBurbujas = 0;
  faseFlujo = 0;
  /** escalera animada: etapas ya dibujadas (con la parte fraccionaria de la que se dibuja) */
  escalon = 0;
  private tEscalera = 0;
  /** receptor de la exploración */
  private recML = 0;
  private recMolL = 0;
  private recMol = 0;
  private vaciando = 0;
  /** divisor */
  private tDivisor = 0;
  private enToma = false;
  private tGotaCond = 0;
  private tGotaAlim = 0;
  private tGotaFondo = 0;
  private rnd = azar(1010);
  /** reto */
  reto: DatosReto | null = null;
  perfil: PerfilReto | null = null;
  historia: PuntoHistoria[] = [];
  private nivelReto = 0;
  referencias: Referencias;

  constructor(mezcla: IdMezcla = 'hexanoHeptano', op: Operacion = { R: 2, Q: 280, total: false }) {
    this.mezcla = MEZCLAS[mezcla];
    this.op = { ...op };
    this.col = new ColumnaDinamica(this.mezcla, this.op);
    this.fl = flujos(this.mezcla, this.op);
    this.referencias = this.calcularReferencias();
    this.vista = this.leer();
    // el receptor entra con algo de destilado (la columna lleva rato en régimen)
    this.recML = 64; this.recMol = 64 / volumenMolar(this.mezcla, this.col.x[0]); this.recMolL = this.recMol * this.col.x[0];
    this.vista = this.leer();
  }

  // ───────────── mandos ─────────────

  /** Otra mezcla: la columna arranca ya en régimen con ella; el receptor, vacío. */
  ponerMezcla(id: IdMezcla) {
    if (id === this.mezcla.id) return;
    this.mezcla = MEZCLAS[id];
    this.col.montar(this.mezcla, this.op);
    this.fl = flujos(this.mezcla, this.op);
    this.recML = 0; this.recMol = 0; this.recMolL = 0; this.vaciando = 0;
    this.gotas = [];
    this.referencias = this.calcularReferencias();
    this.reiniciarEscalera();
    this.generacion++;
    this.vista = this.leer();
    this.version++;
  }

  /** Reflujo, calor o reflujo total: la columna va al régimen nuevo con su dinámica. */
  operar(op: Partial<Operacion>) {
    const n = { ...this.op, ...op };
    if (n.R === this.op.R && n.Q === this.op.Q && n.total === this.op.total) return;
    this.op = n;
    this.col.ajustar(n);
    this.fl = flujos(this.mezcla, n);
    this.referencias = this.calcularReferencias();
    this.version++;
  }

  ponerModo(m: ModoQ10) {
    if (m === this.modo) return;
    this.modo = m;
    this.gotas = [];
    this.reiniciarEscalera();
    this.generacion++;
    this.vista = this.leer();
    this.version++;
  }

  reiniciarEscalera() { this.escalon = 0; this.tEscalera = 0; }

  /** El estado del store (reto). Se llama cada vez que cambia. */
  sincronizarReto(d: DatosReto) {
    const antes = this.reto;
    this.reto = { ...d };
    if (d.tasa > 0) this.perfil = perfilReto(d.volEtanolMatraz, d.volAguaMatraz, d.tasa);
    if (d.volDestilado <= 0 && (antes?.volDestilado ?? 0) > 0) { this.historia = []; this.perfil = null; this.generacion++; }
    const u = this.historia[this.historia.length - 1];
    if (d.volDestilado > 0 && (!u || d.volDestilado - u.v >= 0.25)) this.historia.push({ v: d.volDestilado, T: d.tempCabeza });
    else if (u && d.volDestilado > 0) u.T = d.tempCabeza;
    if (this.modo === 'reto') { this.vista = this.leer(); this.version++; }
  }

  private calcularReferencias(): Referencias {
    const m = this.mezcla;
    const xD = this.col.x[0];
    const r = reflujoMinimo(m, Math.max(m.z + 1e-6, xD), m.z);
    const xB = this.col.x[N_PLATOS + 1];
    return {
      Rmin: r.Rmin, xPellizco: r.xPellizco,
      Nmin: m.alfa ? fenske(xD, xB, m.alfa) : null,
      underwood: m.alfa ? underwood(m.alfa, m.z, xD).Rmin : null,
    };
  }

  // ───────────── el paso ─────────────

  /** Avanza `dtReal` segundos de pantalla. */
  paso(dtReal: number) {
    if (this.pausa || !(dtReal > 0)) return;
    const dt = Math.min(dtReal, 0.1);
    this.tv += dt;
    if (this.modo === 'explorar') {
      this.col.integrar(dt * this.factor);
      // el receptor recoge el destilado (mL de la mezcla condensada)
      const D = this.fl.D / 3600 * dt * this.factor; // mol
      if (this.vaciando > 0) {
        this.vaciando = Math.max(0, this.vaciando - dt);
        this.recML *= Math.exp(-dt * 6);
        if (this.vaciando === 0) { this.recML = 0; this.recMol = 0; this.recMolL = 0; }
      } else if (D > 0) {
        const xD = this.col.x[0];
        this.recML += D * volumenMolar(this.mezcla, xD);
        this.recMol += D; this.recMolL += D * xD;
        if (this.recML >= 240) this.vaciando = 0.9;
      }
      // las referencias (Fenske, R_min) siguen a la columna
      if (Math.floor(this.tv * 4) !== Math.floor((this.tv - dt) * 4)) this.referencias = this.calcularReferencias();
    } else {
      const hierve = (this.reto?.tasa ?? 0) > 0;
      const tau = hierve ? 2.5 : 6;
      this.nivelReto += ((hierve ? 1 : 0) - this.nivelReto) * (1 - Math.exp(-dt / tau));
    }
    this.vista = this.leer();
    this.animar(dt);
    this.version++;
  }

  /** Divisor, gotas, burbujas y escalera (reloj visual). */
  private animar(dt: number) {
    const v = this.vista;
    if (this.reducido) {
      this.gotas = []; this.escalon = ETAPAS; this.vista.embudo = 0; this.embudoActual = 0;
      return;
    }
    this.faseBurbujas += dt * (0.35 + 1.6 * v.vapor);
    this.faseFlujo += dt * (0.4 + 1.4 * v.vapor);
    // ── divisor de reflujo ──
    const hayVapor = v.vapor > 0.01;
    if (Number.isFinite(v.R) && hayVapor) {
      this.tDivisor += dt;
      const T = (v.R + 1) * T_TOMA;
      const f = this.tDivisor % T;
      this.enToma = f >= v.R * T_TOMA;
    } else this.enToma = false;
    const obj = this.enToma ? 1 : 0;
    this.vista.embudo = this.embudoActual + (obj - this.embudoActual) * (1 - Math.exp(-dt / 0.07));
    this.embudoActual = this.vista.embudo;
    // ── gotas ──
    if (hayVapor) {
      this.tGotaCond += dt * (1.6 + 5.5 * v.vapor);
      while (this.tGotaCond >= 1) { this.tGotaCond -= 1; this.soltar({ p: [...PUNTA_CONDENSADOR] as V3, vy: 0, x: v.x[0], yFin: EMBUDO.boca[1], tipo: 'cond' }); }
      this.tGotaFondo += dt * (1.2 + 3.5 * v.vapor);
      while (this.tGotaFondo >= 1) {
        this.tGotaFondo -= 1;
        this.soltar({ p: [(this.rnd() - 0.5) * 0.04, BALON.yBoca - 0.05, (this.rnd() - 0.5) * 0.04], vy: 0, x: v.x[N_PLATOS], yFin: ySuperficieBalon(v.hervidor.mL), tipo: 'fondo' });
      }
    }
    if (v.alimentando) {
      this.tGotaAlim += dt * 3.2;
      while (this.tGotaAlim >= 1) {
        this.tGotaAlim -= 1;
        this.soltar({ p: [-0.345, yPlato(3) + 0.42, -0.12], vy: -0.4, x: v.z, yFin: yPlato(3) + COL.hBajante * v.nivel[3], tipo: 'alim' });
      }
    }
    const nuevas: Gota[] = [];
    for (const g of this.gotas) {
      g.vy -= G_U * dt;
      g.p[1] += g.vy * dt;
      if (g.p[1] > g.yFin) { nuevas.push(g); continue; }
      // llega: la del condensador cae en el embudo y sigue por donde éste apunte
      if (g.tipo === 'cond') {
        if (this.vista.embudo > 0.5) {
          nuevas.push({ p: [...PUNTA_TOMA] as V3, vy: -0.2, x: g.x, yFin: ySuperficieReceptor(v.receptor.mL), tipo: 'toma' });
        } else {
          nuevas.push({ p: [-0.335, yPlato(1) + 0.46, -0.13], vy: -0.3, x: g.x, yFin: yPlato(1) + COL.hBajante * v.nivel[1], tipo: 'reflujo' });
        }
      }
    }
    this.gotas = nuevas.slice(-MAX_GOTAS);
    // ── escalera del dock ──
    this.tEscalera += dt;
    const ciclo = ETAPAS / ETAPAS_POR_S + PAUSA_ESCALERA;
    if (this.tEscalera > ciclo) this.tEscalera -= ciclo;
    this.escalon = Math.min(ETAPAS, this.tEscalera * ETAPAS_POR_S);
  }
  private embudoActual = 0;

  private soltar(g: Gota) {
    if (this.gotas.length >= MAX_GOTAS) return;
    this.gotas.push(g);
  }

  /** Etapa que la escalera está dibujando ahora (1..N + 1) o 0 si está en pausa. */
  get etapaResaltada(): number {
    if (this.escalon >= ETAPAS) return 0;
    return Math.min(ETAPAS, Math.floor(this.escalon) + 1);
  }

  // ───────────── lectura ─────────────

  private leer(): Vista {
    const N = N_PLATOS;
    if (this.modo === 'explorar') {
      const m = this.mezcla, c = this.col;
      const x = Array.from(c.x);
      const y = c.vapores();
      const T = x.map((xi, i) => (i === 0 ? m.tRocio(y[1]) : m.tBurbuja(xi)));
      const vapor = clamp01(this.op.Q / Q_MAX);
      return {
        x, y, T, nivel: x.map(() => 1), vapor,
        hervidor: { mL: m.retencion.hervidor, x: x[N + 1], hierve: true, calor: vapor, T: T[N + 1] },
        receptor: { mL: this.recML, x: this.recMol > 0 ? this.recMolL / this.recMol : x[0] },
        tCabeza: T[0], alimentando: !this.op.total, z: m.z,
        R: this.op.total ? Infinity : this.op.R, embudo: this.vista?.embudo ?? 0,
      };
    }
    // ── reto: el store manda ──
    const d = this.reto;
    const vE = d?.volEtanolMatraz ?? 100, vW = d?.volAguaMatraz ?? 100;
    const xPot = fraccionMolarDesdeVolumenes(vE, vW);
    const hierve = (d?.tasa ?? 0) > 0;
    const p = this.perfil;
    const x = p ? [p.yD, ...p.x, xPot] : Array(N + 2).fill(xPot);
    const y = p ? [p.yD, ...p.y, yEquilibrio(xPot)] : Array(N + 2).fill(yEquilibrio(xPot));
    // sin hervor la columna está fría (o enfriándose como la cabeza del store), no a su punto de burbuja
    const T = x.map((xi, i) => (i === 0 ? d?.tempCabeza ?? 20 : i === N + 1 ? d?.tempMezcla ?? 20 : hierve ? tBurbuja(xi) : Math.min(tBurbuja(xi), d?.tempCabeza ?? 20)));
    const nivel = x.map((_, i) => (i === N + 1 ? 1 : this.nivelReto));
    const tasa = d?.tasa ?? 0;
    const vapor = hierve ? clamp01(0.22 + tasa / 5) : 0;
    const calor = d ? clamp01(hierve ? 0.45 + (d.calorManta - d.tempMezcla) / 80 : (d.calorManta - d.tempMezcla) / 80) : 0;
    const vD = d?.volDestilado ?? 0;
    return {
      x, y, T, nivel, vapor,
      hervidor: { mL: vE + vW, x: xPot, hierve, calor, T: d?.tempMezcla ?? 20 },
      receptor: { mL: vD, x: vD > 0 ? fraccionMolarDesdeVolumenes(d!.volEtanolDest, vD - d!.volEtanolDest) : xPot },
      tCabeza: d?.tempCabeza ?? 20, alimentando: false, z: xPot,
      R: R_RETO, embudo: this.vista?.embudo ?? 0,
    };
  }

  // ───────────── cifras para el dock ─────────────

  /** Caudal de destilado (mL/min de líquido) en la exploración. */
  get destiladoMLmin(): number {
    return (this.fl.D / 60) * volumenMolar(this.mezcla, this.col.x[0]);
  }
  get alimentacionMLmin(): number {
    return (this.fl.F / 60) * volumenMolar(this.mezcla, this.mezcla.z);
  }
  /** Altura del embudo y de la toma para la escena. */
  static readonly ALTURAS = { embudo: CABEZA.yEmbudo, toma: CABEZA.ySalida };
  static readonly R_MAX = R_MAX;
}
