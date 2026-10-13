/**
 * fis09/geometriaCampo.ts — de la física (campo.ts) a búferes de three, sin asignar memoria
 * en cada cuadro: las líneas de campo como cintas que miran a la cámara y las equipotenciales
 * como superficies de revolución torneadas. Topología fija (índices calculados una vez):
 * cuando el reloj mueve r, sólo se reescriben posiciones y atributos.
 *
 * Mundo: x = X_CERO + s/10, y = Y_EJE + ρ·cos φ /10, z = ρ·sin φ /10 (u = dm).
 */
import * as THREE from 'three';
import {
  campoEje, potencialEje, lineasDeCampo, nivelesEquipotenciales, perfilesEquipotencial, rejillaPotencial,
  esferaPotencialCero, escalaEncuadre, LINEAS_POR_MICROC, type Carga, type LineaCampo, type Rejilla,
} from './campo';
import { X_CERO, Y_EJE, ALTO_RIEL } from './constantes';

export interface CalidadCampo {
  /** puntos por línea (remuestreo uniforme en arco) */
  puntos: number;
  /** puntos del perfil de cada equipotencial y segmentos del torno */
  perfil: number;
  segmentos: number;
  rejilla: [number, number];
  maxLineas: number;
  maxCapas: number;
}

export const CALIDAD_CAMPO: Record<'alta' | 'media', CalidadCampo> = {
  alta: { puntos: 150, perfil: 44, segmentos: 64, rejilla: [170, 72], maxLineas: 16 * 12 + 8, maxCapas: 12 },
  media: { puntos: 84, perfil: 30, segmentos: 36, rejilla: [110, 46], maxLineas: 16 * 12 + 8, maxCapas: 12 },
};

const suave = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Dominio visible del campo para la separación r (cm): centro y radio de desvanecimiento. */
export function dominioCampo(r: number) {
  const L = escalaEncuadre(r);
  return { L, centro: r / 2, rVisible: 0.85 * L + r / 2 };
}

// ───────────────────────────── líneas de campo ─────────────────────────────

export class CintasCampo {
  readonly geo = new THREE.BufferGeometry();
  readonly P: number;
  readonly max: number;
  private pos: Float32Array; private tan: Float32Array; private lado: Float32Array;
  private arco: Float32Array; private rev: Float32Array; private pot: Float32Array;
  private bri: Float32Array; private desv: Float32Array;
  /** última lista de líneas (para el diagnóstico y el recuento) */
  lineas: LineaCampo[] = [];
  /** arco máximo (cm) de las líneas actuales: hasta ahí crece el revelado */
  arcoMax = 1;

  constructor(maxLineas: number, puntos: number) {
    this.P = puntos; this.max = maxLineas;
    const nv = maxLineas * puntos * 2;
    this.pos = new Float32Array(nv * 3); this.tan = new Float32Array(nv * 3);
    this.lado = new Float32Array(nv); this.arco = new Float32Array(nv); this.rev = new Float32Array(nv);
    this.pot = new Float32Array(nv); this.bri = new Float32Array(nv); this.desv = new Float32Array(nv);
    for (let v = 0; v < nv; v++) this.lado[v] = v % 2 ? 1 : -1;
    const idx = new Uint32Array(maxLineas * (puntos - 1) * 6);
    let k = 0;
    for (let l = 0; l < maxLineas; l++) for (let p = 0; p < puntos - 1; p++) {
      const a = (l * puntos + p) * 2;
      idx[k++] = a; idx[k++] = a + 1; idx[k++] = a + 2;
      idx[k++] = a + 1; idx[k++] = a + 3; idx[k++] = a + 2;
    }
    const g = this.geo;
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const at = (n: string, arr: Float32Array, d: number) => {
      const b = new THREE.BufferAttribute(arr, d); b.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, b);
    };
    at('position', this.pos, 3); at('aTan', this.tan, 3); at('aLado', this.lado, 1);
    at('aArco', this.arco, 1); at('aRev', this.rev, 1); at('aPot', this.pot, 1); at('aBri', this.bri, 1); at('aDesv', this.desv, 1);
    g.setDrawRange(0, 0);
    // esfera envolvente generosa: la geometría cambia de forma sin recalcularla
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 40);
  }

  /** Recalcula las líneas para las cargas dadas y reescribe los búferes. */
  actualizar(cargas: Carga[], r: number) {
    const { L, centro, rVisible } = dominioCampo(r);
    const lineas = lineasDeCampo(cargas, {
      porMicroC: LINEAS_POR_MICROC, rSiembra: 0.25, rCaptura: 0.3,
      rDominio: rVisible * 1.12, hMin: 0.004 * L, hMax: 0.022 * L, kPaso: 0.07, maxPasos: 1400,
    }).slice(0, this.max);
    this.lineas = lineas;
    const qMax = Math.max(...cargas.map((c) => Math.abs(c.q)), 1e-9);
    const eRef = qMax / (L * L);
    const vRef = qMax / (0.42 * L);
    const P = this.P;
    const e = [0, 0];
    const arcoAcum = new Float64Array(2000);
    let arcoMax = 1;
    lineas.forEach((ln, l) => {
      const n = ln.s.length;
      // arco acumulado del trazo integrado
      const acc = n <= arcoAcum.length ? arcoAcum : new Float64Array(n);
      acc[0] = 0;
      for (let k = 1; k < n; k++) acc[k] = acc[k - 1] + Math.hypot(ln.s[k] - ln.s[k - 1], ln.rho[k] - ln.rho[k - 1]);
      const total = acc[n - 1] || 1e-6;
      arcoMax = Math.max(arcoMax, total);
      const cphi = Math.cos(ln.phi), sphi = Math.sin(ln.phi);
      let j = 0;
      let sPrev = ln.s[0], rPrev = ln.rho[0];
      for (let p = 0; p < P; p++) {
        const objetivo = (p / (P - 1)) * total;
        while (j < n - 2 && acc[j + 1] < objetivo) j++;
        const t = acc[j + 1] > acc[j] ? (objetivo - acc[j]) / (acc[j + 1] - acc[j]) : 0;
        const s = ln.s[j] + t * (ln.s[j + 1] - ln.s[j]);
        const rho = ln.rho[j] + t * (ln.rho[j + 1] - ln.rho[j]);
        // tangente: dirección del trazo en este tramo, orientada a favor de E
        let ts = ln.s[j + 1] - ln.s[j], tr = ln.rho[j + 1] - ln.rho[j];
        if (!(Math.hypot(ts, tr) > 0)) { ts = s - sPrev; tr = rho - rPrev; }
        const m = Math.hypot(ts, tr) || 1;
        ts = (ts / m) * ln.sentido; tr = (tr / m) * ln.sentido;
        sPrev = s; rPrev = rho;
        const x = X_CERO + s / 10, y = Y_EJE + (rho * cphi) / 10, z = (rho * sphi) / 10;
        campoEje(cargas, s, rho, e);
        const E = Math.hypot(e[0], e[1]);
        const V = potencialEje(cargas, s, rho);
        const dCentro = Math.hypot(s - centro, rho);
        const desv = (1 - suave(0.72, 1.0, dCentro / rVisible)) * suave(ALTO_RIEL + 0.05, ALTO_RIEL + 0.45, y);
        const bri = Math.min(1.5, Math.max(0.12, 0.42 + 0.3 * Math.log10(Math.max(1e-9, E / eRef))));
        const pot = Math.tanh((0.9 * V) / vRef);
        const arcoE = ln.sentido > 0 ? objetivo : total - objetivo;
        for (let lado = 0; lado < 2; lado++) {
          const v = (l * P + p) * 2 + lado;
          this.pos[v * 3] = x; this.pos[v * 3 + 1] = y; this.pos[v * 3 + 2] = z;
          this.tan[v * 3] = ts; this.tan[v * 3 + 1] = tr * cphi; this.tan[v * 3 + 2] = tr * sphi;
          this.arco[v] = arcoE; this.rev[v] = objetivo; this.pot[v] = pot; this.bri[v] = bri; this.desv[v] = desv;
        }
      }
    });
    this.arcoMax = arcoMax;
    const g = this.geo;
    for (const n of ['position', 'aTan', 'aArco', 'aRev', 'aPot', 'aBri', 'aDesv']) (g.getAttribute(n) as THREE.BufferAttribute).needsUpdate = true;
    g.setDrawRange(0, lineas.length * (P - 1) * 6);
  }

  dispose() { this.geo.dispose(); }
}

// ───────────────────────────── equipotenciales ─────────────────────────────

export interface Capa { s: Float64Array; rho: Float64Array; nivel: number; plano?: boolean; peso?: number }

export class CapasEquipotenciales {
  readonly geo = new THREE.BufferGeometry();
  readonly M: number; readonly S: number; readonly max: number;
  private pos: Float32Array; private nor: Float32Array; private niv: Float32Array; private desv: Float32Array;
  private rejilla: Float64Array | null = null;
  capas: Capa[] = [];

  constructor(maxCapas: number, perfil: number, segmentos: number) {
    this.M = perfil; this.S = segmentos; this.max = maxCapas;
    const porCapa = perfil * (segmentos + 1);
    const nv = maxCapas * porCapa;
    this.pos = new Float32Array(nv * 3); this.nor = new Float32Array(nv * 3);
    this.niv = new Float32Array(nv); this.desv = new Float32Array(nv);
    const idx = new Uint32Array(maxCapas * (perfil - 1) * segmentos * 6);
    let k = 0;
    for (let c = 0; c < maxCapas; c++) for (let i = 0; i < perfil - 1; i++) for (let j = 0; j < segmentos; j++) {
      const a = c * porCapa + i * (segmentos + 1) + j, b = a + segmentos + 1;
      idx[k++] = a; idx[k++] = b; idx[k++] = a + 1;
      idx[k++] = a + 1; idx[k++] = b; idx[k++] = b + 1;
    }
    const g = this.geo;
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const at = (n: string, arr: Float32Array, d: number) => {
      const b = new THREE.BufferAttribute(arr, d); b.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, b);
    };
    at('position', this.pos, 3); at('normal', this.nor, 3); at('aNivel', this.niv, 1); at('aDesv', this.desv, 1);
    // ninguna normal nula ni siquiera en las ranuras sin usar (la sonda de salud las barre todas)
    for (let v = 0; v < nv; v++) this.nor[v * 3] = 1;
    g.setDrawRange(0, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 40);
  }

  actualizar(cargas: Carga[], r: number, gr: [number, number]) {
    const { L, rVisible } = dominioCampo(r);
    const reji: Rejilla = { s0: -1.15 * L, s1: r + 1.15 * L, rhoMax: 1.15 * L, ns: gr[0], nr: gr[1] };
    const W = (gr[0] + 1) * (gr[1] + 1);
    if (!this.rejilla || this.rejilla.length < W) this.rejilla = new Float64Array(W);
    const V = rejillaPotencial(cargas, reji, this.rejilla);
    const qMax = Math.max(...cargas.map((c) => Math.abs(c.q)), 1e-9);
    const vRef = qMax / (0.42 * L);
    const capas: Capa[] = [];
    for (const v0 of nivelesEquipotenciales(cargas, L)) {
      for (const p of perfilesEquipotencial(cargas, v0, reji, this.M, V)) capas.push({ ...p, nivel: Math.tanh((0.9 * v0) / vRef) });
    }
    // V = 0 entre cargas opuestas: plano medio (|q₁| = |q₂|) o esfera de Apolonio
    if (cargas.length === 2 && cargas[0].q * cargas[1].q < 0) {
      const esf = esferaPotencialCero(cargas);
      const M = this.M;
      if (!esf) {
        const s = new Float64Array(M), rho = new Float64Array(M);
        for (let i = 0; i < M; i++) { s[i] = (cargas[0].s + cargas[1].s) / 2; rho[i] = (i / (M - 1)) * rVisible * 0.7; }
        capas.push({ s, rho, nivel: 0, plano: true });
      } else if (esf.radio < 1.05 * L) {
        const s = new Float64Array(M), rho = new Float64Array(M);
        for (let i = 0; i < M; i++) { const a = Math.PI * (1 - i / (M - 1)); s[i] = esf.centro + esf.radio * Math.cos(a); rho[i] = esf.radio * Math.sin(a); }
        capas.push({ s, rho, nivel: 0 });
      }
    }
    // las superficies grandes (p. ej. la que envuelve a dos cargas del mismo signo) se atenúan:
    // si no, su relleno ocupa todo el encuadre como un velo
    for (const c of capas) {
      if (c.plano) continue;
      let rMax = 0, s0 = Infinity, s1 = -Infinity;
      for (let i = 0; i < c.s.length; i++) { rMax = Math.max(rMax, c.rho[i]); s0 = Math.min(s0, c.s[i]); s1 = Math.max(s1, c.s[i]); }
      const tam = Math.max(rMax, (s1 - s0) / 2);
      c.peso = Math.min(1, Math.max(0.2, 1.3 - tam / (0.85 * L)));
    }
    this.capas = capas.slice(0, this.max);
    const S = this.S, M = this.M, porCapa = M * (S + 1);
    const e = [0, 0];
    this.capas.forEach((c, ci) => {
      for (let i = 0; i < M; i++) {
        const s = c.s[i], rho = c.rho[i];
        campoEje(cargas, s, rho, e);
        let ns = -e[0], nr = -e[1]; // ∇V
        if (c.plano) { ns = 1; nr = 0; }
        const nm = Math.hypot(ns, nr) || 1;
        ns /= nm; nr /= nm;
        // el plano medio (V = 0 de cargas iguales y opuestas) se ve casi de canto: a la mitad que la esfera de Apolonio
        const desvR = c.plano ? 0.5 * (1 - suave(0.25, 1.0, rho / (rVisible * 0.7))) : c.peso ?? 1;
        for (let j = 0; j <= S; j++) {
          const phi = (j / S) * Math.PI * 2;
          const cp = Math.cos(phi), sp = Math.sin(phi);
          const v = ci * porCapa + i * (S + 1) + j;
          const y = Y_EJE + (rho * cp) / 10;
          this.pos[v * 3] = X_CERO + s / 10; this.pos[v * 3 + 1] = y; this.pos[v * 3 + 2] = (rho * sp) / 10;
          this.nor[v * 3] = ns; this.nor[v * 3 + 1] = nr * cp; this.nor[v * 3 + 2] = nr * sp;
          // en el eje (ρ = 0) la normal es ±s: nunca nula
          if (!(Math.hypot(ns, nr) > 0.5)) { this.nor[v * 3] = 1; }
          this.niv[v] = c.nivel;
          this.desv[v] = desvR * suave(ALTO_RIEL + 0.05, ALTO_RIEL + 0.4, y);
        }
      }
    });
    const g = this.geo;
    for (const n of ['position', 'normal', 'aNivel', 'aDesv']) (g.getAttribute(n) as THREE.BufferAttribute).needsUpdate = true;
    g.setDrawRange(0, this.capas.length * (M - 1) * S * 6);
  }

  dispose() { this.geo.dispose(); }
}
