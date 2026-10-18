/**
 * fis10/lineas.ts — LÍNEAS DE CAMPO del corte (módulo puro, sin three).
 *
 * En un problema plano las líneas de B son las curvas A_z = cte, y entre dos líneas pasa
 * el mismo flujo por metro de fondo (ΔΦ/L = ΔA). Se trazan niveles EQUIESPACIADOS de A:
 * donde las líneas se juntan, B es mayor (yugo); donde se separan, menor (inducido).
 * A_z se evalúa en una rejilla polar (r, φ) con la serie exacta de motor.ts y las curvas
 * de nivel salen por «marching squares» (el caso ambiguo se decide con el valor central).
 * Todas son cerradas: A = 0 en el borde exterior del yugo (no sale flujo).
 *
 * Unidades de salida: cm (1 u de la escena = 1 cm), con el corte en el plano z = 0.
 */
import { GEOM, R_O, campo, campoPolar, coefRadiales, type TipoCampo } from './motor';

export interface LineaCampo {
  /** puntos remuestreados a arco uniforme (cm), orientados en el sentido de B */
  x: Float32Array;
  y: Float32Array;
  /** arco acumulado (cm) */
  s: Float32Array;
  /** |B| en cada punto (T) */
  b: Float32Array;
  /** longitud total (cm) */
  largo: number;
  /** nivel de A (Wb/m) con la imantación de referencia */
  nivel: number;
}

export interface OpcionesLineas {
  /** niveles por signo de A (el dipolo da 2·n lazos; el cuadrupolo, 4·n) */
  porSigno: number;
  /** puntos por línea */
  puntos: number;
  /** rejilla polar */
  nr: number;
  nphi: number;
}

export const OPCIONES_LINEAS: OpcionesLineas = { porSigno: 7, puntos: 220, nr: 170, nphi: 720 };

interface Rejilla { A: Float64Array; nr: number; nphi: number; dr: number; dphi: number; max: number }

function rejilla(tipo: TipoCampo, nr: number, nphi: number): Rejilla {
  const sol = campo(tipo);
  const nH = sol.arm.length;
  const dr = R_O / (nr - 1), dphi = (2 * Math.PI) / nphi;
  // tabla sen(nφ) por armónico
  const senos = new Float64Array(nH * nphi);
  for (let k = 0; k < nH; k++) {
    const n = sol.arm[k].n;
    for (let j = 0; j < nphi; j++) senos[k * nphi + j] = Math.sin(n * j * dphi);
  }
  const A = new Float64Array(nr * nphi);
  const a = new Float64Array(nH);
  let max = 0;
  for (let i = 1; i < nr; i++) {
    coefRadiales(sol, i * dr, a);
    for (let j = 0; j < nphi; j++) {
      let s = 0;
      for (let k = 0; k < nH; k++) s += a[k] * senos[k * nphi + j];
      A[i * nphi + j] = s;
      if (Math.abs(s) > max) max = Math.abs(s);
    }
  }
  return { A, nr, nphi, dr, dphi, max };
}

/** Curvas de nivel A = c en la rejilla polar (polilíneas cerradas en coordenadas cartesianas, m). */
function curvasNivel(g: Rejilla, c: number): { x: number[]; y: number[] }[] {
  const { A, nr, nphi, dr, dphi } = g;
  const val = (i: number, j: number) => A[i * nphi + (j % nphi)];
  // punto de cruce por arista (id único y compartido entre las dos celdas vecinas)
  const puntos = new Map<number, [number, number]>();
  const cruce = (id: number, i0: number, j0: number, i1: number, j1: number): number => {
    if (!puntos.has(id)) {
      const v0 = val(i0, j0), v1 = val(i1, j1);
      const t = (c - v0) / (v1 - v0);
      const r = (i0 + (i1 - i0) * t) * dr;
      const f = (j0 + (j1 - j0) * t) * dphi;
      puntos.set(id, [r * Math.cos(f), r * Math.sin(f)]);
    }
    return id;
  };
  const H = (i: number, j: number) => 2 * (i * nphi + (j % nphi));
  const V = (i: number, j: number) => 2 * (i * nphi + (j % nphi)) + 1;
  const segs: [number, number][] = [];
  for (let i = 0; i < nr - 1; i++) {
    for (let j = 0; j < nphi; j++) {
      const v0 = val(i, j), v1 = val(i + 1, j), v2 = val(i + 1, j + 1), v3 = val(i, j + 1);
      const caso = (v0 > c ? 1 : 0) | (v1 > c ? 2 : 0) | (v2 > c ? 4 : 0) | (v3 > c ? 8 : 0);
      if (caso === 0 || caso === 15) continue;
      const e0 = () => cruce(H(i, j), i, j, i + 1, j);
      const e1 = () => cruce(V(i + 1, j), i + 1, j, i + 1, j + 1);
      const e2 = () => cruce(H(i, j + 1), i, j + 1, i + 1, j + 1);
      const e3 = () => cruce(V(i, j), i, j, i, j + 1);
      const centro = (v0 + v1 + v2 + v3) / 4 > c;
      switch (caso) {
        case 1: case 14: segs.push([e3(), e0()]); break;
        case 2: case 13: segs.push([e0(), e1()]); break;
        case 3: case 12: segs.push([e3(), e1()]); break;
        case 4: case 11: segs.push([e1(), e2()]); break;
        case 6: case 9: segs.push([e0(), e2()]); break;
        case 7: case 8: segs.push([e3(), e2()]); break;
        case 5: if (centro) { segs.push([e0(), e1()], [e2(), e3()]); } else { segs.push([e3(), e0()], [e1(), e2()]); } break;
        case 10: if (centro) { segs.push([e3(), e0()], [e1(), e2()]); } else { segs.push([e0(), e1()], [e2(), e3()]); } break;
      }
    }
  }
  // encadenar: cada arista la comparten como mucho dos segmentos
  const porArista = new Map<number, number[]>();
  segs.forEach(([a, b], k) => {
    for (const e of [a, b]) { const l = porArista.get(e); if (l) l.push(k); else porArista.set(e, [k]); }
  });
  const usado = new Uint8Array(segs.length);
  const curvas: { x: number[]; y: number[] }[] = [];
  for (let k0 = 0; k0 < segs.length; k0++) {
    if (usado[k0]) continue;
    usado[k0] = 1;
    const cadena = [segs[k0][0], segs[k0][1]];
    // hacia delante desde el final; luego hacia atrás desde el principio (si no cerró)
    for (const sentido of [1, -1]) {
      for (let guard = 0; guard < segs.length; guard++) {
        const extremo = sentido > 0 ? cadena[cadena.length - 1] : cadena[0];
        const sig = (porArista.get(extremo) ?? []).find((s) => !usado[s]);
        if (sig === undefined) break;
        usado[sig] = 1;
        const [a, b] = segs[sig];
        const otro = a === extremo ? b : a;
        if (sentido > 0) cadena.push(otro); else cadena.unshift(otro);
      }
    }
    if (cadena.length < 8) continue;
    curvas.push({ x: cadena.map((e) => puntos.get(e)![0]), y: cadena.map((e) => puntos.get(e)![1]) });
  }
  return curvas;
}

/** Remuestrea una polilínea (m) a `P` puntos de arco uniforme, en cm, orientada a favor de B. */
function remuestrear(tipo: TipoCampo, cx: number[], cy: number[], P: number, nivel: number): LineaCampo {
  const n = cx.length;
  const cerrada = Math.hypot(cx[0] - cx[n - 1], cy[0] - cy[n - 1]) < 1e-9;
  const xs = cx.slice(), ys = cy.slice();
  if (!cerrada) { xs.push(cx[0]); ys.push(cy[0]); }
  const m = xs.length;
  const acc = new Float64Array(m);
  for (let k = 1; k < m; k++) acc[k] = acc[k - 1] + Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1]);
  const total = acc[m - 1];
  // orientación: B·t > 0 en el primer tramo
  const sol = campo(tipo);
  const k1 = Math.min(m - 1, 3);
  const tx = xs[k1] - xs[0], ty = ys[k1] - ys[0];
  const r0 = Math.hypot(xs[0], ys[0]), f0 = Math.atan2(ys[0], xs[0]);
  const [br, bp] = campoPolar(sol, r0, f0);
  const bx = br * Math.cos(f0) - bp * Math.sin(f0), by = br * Math.sin(f0) + bp * Math.cos(f0);
  const invertir = bx * tx + by * ty < 0;
  const X = new Float32Array(P), Y = new Float32Array(P), S = new Float32Array(P), B = new Float32Array(P);
  let j = 0;
  const out: [number, number] = [0, 0];
  for (let p = 0; p < P; p++) {
    // P puntos con el último igual al primero (lazo cerrado)
    const objetivo = (p / (P - 1)) * total;
    const o = invertir ? total - objetivo : objetivo;
    while (j < m - 2 && acc[j + 1] < o) j++;
    while (j > 0 && acc[j] > o) j--;
    const t = acc[j + 1] > acc[j] ? (o - acc[j]) / (acc[j + 1] - acc[j]) : 0;
    const x = xs[j] + t * (xs[j + 1] - xs[j]), y = ys[j] + t * (ys[j + 1] - ys[j]);
    X[p] = x * 100; Y[p] = y * 100; S[p] = objetivo * 100;
    const r = Math.hypot(x, y), f = Math.atan2(y, x);
    campoPolar(sol, Math.max(1e-6, r), f, out);
    B[p] = Math.hypot(out[0], out[1]);
  }
  return { x: X, y: Y, s: S, b: B, largo: total * 100, nivel };
}

const cache = new Map<string, { lineas: LineaCampo[]; dA: number }>();

/**
 * Líneas de campo de la configuración de referencia de `tipo` (dipolo: izq. N, der. S;
 * cuadrupolo: los dos N). Con la configuración invertida el campo cambia de signo: las
 * mismas curvas recorridas al revés (`invertida`).
 */
export function lineasCampo(tipo: TipoCampo, op: OpcionesLineas = OPCIONES_LINEAS): LineaCampo[] {
  return trazar(tipo, op).lineas;
}

function trazar(tipo: TipoCampo, op: OpcionesLineas) {
  const clave = `${tipo}:${op.porSigno}:${op.puntos}:${op.nr}:${op.nphi}`;
  const hit = cache.get(clave);
  if (hit) return hit;
  const g = rejilla(tipo, op.nr, op.nphi);
  const dA = g.max / op.porSigno;
  const lineas: LineaCampo[] = [];
  for (let k = 1; k <= op.porSigno; k++) {
    for (const s of [1, -1]) {
      const c = s * (k - 0.5) * dA;
      for (const cv of curvasNivel(g, c)) lineas.push(remuestrear(tipo, cv.x, cv.y, op.puntos, c));
    }
  }
  const r = { lineas, dA };
  cache.set(clave, r);
  return r;
}

/** Flujo por metro de fondo entre dos líneas vecinas (Wb/m): ΔA. */
export function flujoEntreLineas(tipo: TipoCampo, op: OpcionesLineas = OPCIONES_LINEAS): number {
  return trazar(tipo, op).dA;
}

/** Radio del inducido y exterior del yugo en cm (para encuadres y pruebas). */
export const RADIOS_CM = { Rr: GEOM.Rr * 100, Ro: R_O * 100 };
