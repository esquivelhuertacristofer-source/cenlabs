/**
 * bio06/bosque.ts — la GEOMETRÍA del claro del bosque (módulo puro: sin three ni React).
 *
 * Escala del kit: 1 u = 1 dm. El roble principal mide 60 cm de diámetro; la polilla, 5,5 cm de
 * envergadura (su tamaño real); el carbonero, 14 cm de largo. Lo comparten la escena (que construye
 * la malla del tronco con `radioTronco`) y el reloj (que posa las polillas y guía a las aves sobre
 * esa MISMA superficie).
 *
 * Convención: θ = 0 mira a la cámara (+Z); el eje del tronco está en (0, ·, Z_EJE).
 */
export type V3 = [number, number, number];

export const TRONCO = { R: 3.0, zEje: -3.0, alto: 46 } as const;
/** Franja de la corteza donde se posan las polillas (θ en rad, y en u). */
export const FRANJA = { thMax: 1.0, yMin: 3.0, yMax: 10.2 } as const;
/** Envergadura de la polilla (u = dm): 5,5 cm. */
export const ENVERGADURA = 0.55;

/** Radio del tronco en (θ, y): contrafuertes de raíz en el pie y un relieve suave de baja frecuencia. */
export function radioTronco(th: number, y: number): number {
  const yy = Math.max(0, y);
  const lobulos = 0.55 + 0.45 * Math.pow(Math.max(0, Math.cos(4 * th + 0.6)), 2);
  const pie = 0.42 * Math.exp(-yy / 1.5) * lobulos;
  const relieve = 0.055 * Math.sin(3 * th + 0.8 + 0.05 * y) + 0.04 * Math.sin(5 * th - 0.11 * y + 2.1) + 0.03 * Math.sin(2 * th + 0.07 * y);
  // el tronco se afina muy poco hacia arriba
  return TRONCO.R * (1 + pie - 0.004 * yy) + relieve;
}

export function puntoTronco(th: number, y: number, sobre = 0): V3 {
  const r = radioTronco(th, y) + sobre;
  return [r * Math.sin(th), y, TRONCO.zEje + r * Math.cos(th)];
}

const norm = (v: V3): V3 => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const resta = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const suma = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const escala = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const punto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const normalizar = norm;
export const mezcla = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Normal exterior de la corteza (derivadas numéricas de la superficie). */
export function normalTronco(th: number, y: number): V3 {
  const e = 1e-3;
  const dth = resta(puntoTronco(th + e, y), puntoTronco(th - e, y));
  const dy = resta(puntoTronco(th, y + e), puntoTronco(th, y - e));
  let n = norm(cruz(dth, dy));
  const radial: V3 = [Math.sin(th), 0, Math.cos(th)];
  if (punto(n, radial) < 0) n = escala(n, -1);
  return n;
}

/** Marco de una polilla posada: normal (dorso), cabeza (tangente girada `giro` desde la vertical) y derecha. */
export function marcoPosada(th: number, y: number, giro: number): { pos: V3; n: V3; cabeza: V3; derecha: V3 } {
  const n = normalTronco(th, y);
  // vertical proyectada en el plano tangente
  const arriba = norm(resta([0, 1, 0], escala(n, n[1])));
  const lado = norm(cruz(arriba, n)); // hacia la derecha de la polilla vista desde fuera
  const c = Math.cos(giro), s = Math.sin(giro);
  const cabeza = norm(suma(escala(arriba, c), escala(lado, -s)));
  const derecha = norm(cruz(cabeza, n));
  return { pos: puntoTronco(th, y, 0.012), n, cabeza, derecha };
}

// ───────────────────────────── dónde se posa cada polilla ─────────────────────────────

export interface Lugar { th: number; y: number; giro: number }

/**
 * Separa los puntos que el sorteo dejó encimados (relajación determinista en coordenadas de arco),
 * siempre dentro de la franja. Sólo cambia DÓNDE se dibujan; no toca el estado.
 */
export function relajar(pts: { th: number; y: number }[], dMin: number): { th: number; y: number }[] {
  const R = TRONCO.R;
  const p = pts.map((q) => ({ s: q.th * R, y: q.y }));
  const sMax = FRANJA.thMax * R;
  for (let it = 0; it < 60; it++) {
    let mov = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[j].s - p[i].s, dy = p[j].y - p[i].y;
        const d = Math.hypot(dx, dy);
        if (d < dMin) {
          const nx = d > 1e-6 ? dx / d : (i % 2 ? 1 : -1), ny = d > 1e-6 ? dy / d : 0.3;
          const f = (dMin - d) / 2;
          p[i].s -= nx * f; p[i].y -= ny * f; p[j].s += nx * f; p[j].y += ny * f;
          mov = true;
        }
      }
    }
    for (const q of p) { q.s = Math.min(sMax, Math.max(-sMax, q.s)); q.y = Math.min(FRANJA.yMax, Math.max(FRANJA.yMin, q.y)); }
    if (!mov) break;
  }
  return p.map((q) => ({ th: q.s / R, y: q.y }));
}

/** Distancia mínima entre polillas según cuántas haya en la franja (nunca menos de 1,15 envergaduras). */
export function separacion(n: number): number {
  const area = 2 * FRANJA.thMax * TRONCO.R * (FRANJA.yMax - FRANJA.yMin);
  return Math.min(1.5, Math.max(ENVERGADURA * 1.15, Math.sqrt(area / Math.max(1, n)) * 0.8));
}

/** n lugares al azar sobre la franja, separados. `rng` en [0,1). */
export function sembrar(n: number, rng: () => number): Lugar[] {
  const brutos = Array.from({ length: n }, () => ({
    th: (rng() * 2 - 1) * FRANJA.thMax,
    y: FRANJA.yMin + rng() * (FRANJA.yMax - FRANJA.yMin),
  }));
  return relajar(brutos, separacion(n)).map((q) => ({ ...q, giro: (rng() - 0.5) * 1.7 }));
}

/** Del % del store (x 0–100 de izquierda a derecha; y 0–100 de arriba abajo) a la corteza. */
export function lugarDelStore(xPct: number, yPct: number, angle: number): Lugar {
  return {
    th: (Math.min(100, Math.max(0, xPct)) / 100 * 2 - 1) * FRANJA.thMax,
    y: FRANJA.yMax - (Math.min(100, Math.max(0, yPct)) / 100) * (FRANJA.yMax - FRANJA.yMin),
    giro: (((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) - 0.5) * 1.7,
  };
}

// ───────────────────────────── ramas y perchas ─────────────────────────────

export interface Rama { puntos: V3[]; radios: number[] }

/** Dos ramas que salen del roble a los lados de la franja (una alta a la derecha y una baja a la izquierda). */
export const RAMAS: Rama[] = [
  {
    puntos: [puntoTronco(1.08, 8.7, -0.6), [4.4, 9.2, -1.5], [7.2, 10.0, -1.1], [10.0, 11.4, -0.3]],
    radios: [0.55, 0.32, 0.2, 0.09],
  },
  {
    puntos: [puntoTronco(-1.1, 4.7, -0.6), [-4.3, 5.2, -1.4], [-6.9, 6.0, -0.9], [-9.4, 7.3, -0.1]],
    radios: [0.48, 0.28, 0.17, 0.08],
  },
];

/** Punto de una rama (Catmull-Rom centrípeta simple por tramos) para t ∈ [0, 1]. */
export function puntoRama(r: Rama, t: number): V3 {
  const n = r.puntos.length - 1;
  const x = Math.min(n - 1e-9, Math.max(0, t * n));
  const i = Math.floor(x), u = x - i;
  const p0 = r.puntos[Math.max(0, i - 1)], p1 = r.puntos[i], p2 = r.puntos[i + 1], p3 = r.puntos[Math.min(n, i + 2)];
  const u2 = u * u, u3 = u2 * u;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), f(p0[2], p1[2], p2[2], p3[2])];
}
export function radioRama(r: Rama, t: number): number {
  const n = r.radios.length - 1;
  const x = Math.min(n, Math.max(0, t * n));
  const i = Math.min(n - 1, Math.floor(x));
  return r.radios[i] + (r.radios[i + 1] - r.radios[i]) * (x - i);
}

/** Perchas de las aves (encima de la rama): [rama, t]. El ave 0 es la del reto. */
const PERCHAS_RT: [number, number][] = [[0, 0.37], [1, 0.42], [0, 0.62]];
export const PERCHAS: V3[] = PERCHAS_RT.map(([ri, t]) => {
  const p = puntoRama(RAMAS[ri], t);
  return [p[0], p[1] + radioRama(RAMAS[ri], t) + 0.34, p[2]];
});
/** Hacia dónde mira cada ave posada (yaw, rad): hacia la franja de polillas. */
export const YAW_PERCHA = PERCHAS.map((p) => Math.atan2(0 - p[0], 0.5 - p[2]));

/** Puntos fuera de cuadro por donde llegan y se van polillas y aves. */
export function puntoFuera(rng: () => number, lado?: number): V3 {
  const s = lado ?? (rng() < 0.5 ? -1 : 1);
  return [s * (11 + rng() * 6), 13 + rng() * 9, -1 + rng() * 8];
}

/** Caja que encuadra la cámara: la franja de polillas y las perchas (en u). */
export function cajaEncuadre(): { min: V3; max: V3; puntos: V3[] } {
  const pts: V3[] = [];
  for (const th of [-FRANJA.thMax, 0, FRANJA.thMax]) for (const y of [FRANJA.yMin - 0.4, FRANJA.yMax + 0.5]) pts.push(puntoTronco(th, y, 0.1));
  for (const p of PERCHAS) pts.push([p[0], p[1] + 0.5, p[2]]);
  const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
  return { min, max, puntos: pts };
}
