/**
 * _kit/calculos.ts — funciones PURAS del kit (sin three ni React): se prueban en
 * jest (src/__tests__/kit3d.test.ts) y las usan los componentes.
 */

// ───────────────────────────── matemáticas ─────────────────────────────

/** Formatea un número de eje sin ceros de sobra y con signo menos tipográfico. */
export function numeroEje(v: number): string {
  const r = Math.abs(v) < 1e-9 ? 0 : v;
  const s = +r.toFixed(6);
  return String(s).replace('-', '−');
}

/** Paso "bonito" (1, 2, 5 × 10ⁿ) para que haya como mucho `max` etiquetas en `rango`. */
export function pasoBonito(rango: number, max = 10): number {
  const bruto = rango / Math.max(1, max);
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 5, 10]) if (k * p >= bruto - 1e-12) return k * p;
  return 10 * p;
}

/**
 * Barrido de un ángulo (grados, antihorario desde +X).
 *  - 'antihorario': de `desde` a `hasta` girando en sentido positivo, en [0, 360).
 *  - 'horario':     girando en sentido negativo, en (−360, 0].
 *  - 'menor':       el arco más corto entre ambos, en (−180, 180].
 */
export function barridoAngulo(desde: number, hasta: number, sentido: 'antihorario' | 'horario' | 'menor' = 'menor'): { inicio: number; barrido: number } {
  let d = (((hasta - desde) % 360) + 360) % 360; // [0, 360)
  if (sentido === 'horario') d = d === 0 ? 0 : d - 360;
  else if (sentido === 'menor' && d > 180) d -= 360;
  return { inicio: desde, barrido: d };
}

/** Ángulo (grados) de un vector 2D. */
export const anguloDe = (v: [number, number]) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;

/**
 * Muestreo adaptativo de y = f(x) en [a, b]: subdivide donde la curva se aparta de
 * la cuerda más de `tol` (en unidades de escena, tras `escala`) y corta en tramos
 * donde f no es finita, se sale de `recorteY` o salta (asíntotas).
 */
export function muestrearFuncion(
  f: (x: number) => number, a: number, b: number,
  { escala = 1, tol = 0.004, inicial = 48, profundidad = 9, recorteY = [-Infinity, Infinity] as [number, number] } = {},
): [number, number][][] {
  const tramos: [number, number][][] = [];
  let actual: [number, number][] = [];
  const ok = (y: number) => Number.isFinite(y) && y >= recorteY[0] && y <= recorteY[1];
  const salto = (recorteY[1] - recorteY[0]) * 0.5;
  const cerrar = () => { if (actual.length > 1) tramos.push(actual); actual = []; };
  const seg = (x0: number, y0: number, x1: number, y1: number, d: number) => {
    const xm = (x0 + x1) / 2, ym = f(xm);
    const finitos = ok(y0) && ok(y1) && ok(ym);
    const desv = Math.abs(ym - (y0 + y1) / 2) * escala;
    const grande = Number.isFinite(salto) && finitos && Math.abs(y1 - y0) > salto;
    if (d < profundidad && (!finitos || desv > tol || grande)) {
      seg(x0, y0, xm, ym, d + 1); seg(xm, ym, x1, y1, d + 1);
      return;
    }
    if (!ok(y1) || grande) { cerrar(); if (ok(y1)) actual.push([x1, y1]); return; }
    if (actual.length === 0 && ok(y0)) actual.push([x0, y0]);
    actual.push([x1, y1]);
  };
  let x0 = a, y0 = f(a);
  for (let i = 1; i <= inicial; i++) {
    const x1 = a + ((b - a) * i) / inicial, y1 = f(x1);
    seg(x0, y0, x1, y1, 0);
    x0 = x1; y0 = y1;
  }
  cerrar();
  return tramos;
}

// ───────────────────────────── instrumentos y mecánica ─────────────────────────────

/** Formatea segundos como mm:ss.cc (cronómetro). */
export function formatoCronometro(t: number): string {
  const s = Math.max(0, t);
  const cent = Math.floor(s * 100 + 1e-6);
  const mm = Math.floor(cent / 6000), ss = Math.floor((cent % 6000) / 100), cc = cent % 100;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cc).padStart(2, '0')}`;
}

/** Alargamiento del gancho del dinamómetro (u) para una fuerza dada: escala lineal. */
export function dinamometroAlargamiento(fuerza: number, max = 10, longitud = 2.6) {
  const escala = longitud * 0.72;
  return (Math.max(0, Math.min(max * 1.05, fuerza)) / max) * escala;
}

const DENSIDAD = { laton: 8.5, hierro: 7.8 }; // g/cm³
/** Diámetro y espesor (u) de una pesa ranurada de `gramos` g: el espesor sale de la masa. */
export function dimensionesPesa(gramos: number, material: 'laton' | 'hierro' = 'laton') {
  const D = gramos <= 20 ? 3.0 : 4.6; // cm
  const area = Math.PI * (D / 2) ** 2 - 0.45 * D / 2 - Math.PI * 0.225 ** 2; // cm² sin ranura ni agujero
  const espesorCm = gramos / (DENSIDAD[material] * area);
  return { diametro: D / 10, espesor: espesorCm / 10 };
}

/** Altura (u) de una pila de pesas ranuradas. */
export function alturaPila(masas: number[], material: 'laton' | 'hierro' = 'laton') {
  return masas.reduce((s, g) => s + dimensionesPesa(g, material).espesor, 0);
}

// ───────────────────────────── texto ─────────────────────────────

export interface Tramo { t: string; nivel: 0 | 1 | -1; cursiva: boolean }

/** Analiza el mini-formato de etiquetas:  x^2  x^{10}  v_0  v_{max}  *cursiva*. */
export function analizarFormato(s: string): Tramo[] {
  const out: Tramo[] = [];
  let i = 0, cursiva = false, buf = '';
  const vaciar = () => { if (buf) { out.push({ t: buf, nivel: 0, cursiva }); buf = ''; } };
  while (i < s.length) {
    const c = s[i];
    if (c === '*') { vaciar(); cursiva = !cursiva; i++; continue; }
    if ((c === '^' || c === '_') && i + 1 < s.length) {
      vaciar();
      const nivel = c === '^' ? 1 : -1;
      let t = '';
      if (s[i + 1] === '{') {
        const j = s.indexOf('}', i + 2);
        t = s.slice(i + 2, j < 0 ? s.length : j); i = j < 0 ? s.length : j + 1;
      } else { t = s[i + 1]; i += 2; }
      out.push({ t, nivel: nivel as 1 | -1, cursiva });
      continue;
    }
    buf += c; i++;
  }
  vaciar();
  return out;
}

// ───────────────────────────── catenaria ─────────────────────────────

/**
 * Catenaria entre dos puntos 3D con una longitud de cable `largo = distancia·(1+holgura)`.
 * Resuelve el parámetro a de y = a·cosh((x−x₀)/a) por bisección. Si `ySuelo` se
 * da, el cable se apoya en ese plano en vez de atravesarlo (cable sobre la mesa).
 * Devuelve n puntos (x, y, z) consecutivos.
 */
export function puntosCatenaria(
  A: [number, number, number], Bp: [number, number, number], holgura = 0.15, n = 48, ySuelo?: number,
): Float32Array {
  const out = new Float32Array(n * 3);
  const dx = Bp[0] - A[0], dz = Bp[2] - A[2];
  const h = Math.hypot(dx, dz), v = Bp[1] - A[1];
  const dist = Math.hypot(h, v);
  const L = dist * (1 + Math.max(0.001, holgura));
  if (h < 1e-4) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const s = Math.sin(Math.PI * t) * (L - dist) * 0.5;
      out.set([A[0] + dx * t + s, A[1] + v * t, A[2] + dz * t], i * 3);
    }
    return out;
  }
  const objetivo = Math.sqrt(Math.max(1e-12, L * L - v * v));
  // 2a·sinh(h/2a) = objetivo: decreciente en a
  let lo = 1e-4, hi = 1e4;
  for (let k = 0; k < 100; k++) {
    const m = Math.sqrt(lo * hi);
    const f = 2 * m * Math.sinh(Math.min(700, h / (2 * m)));
    if (f > objetivo) lo = m; else hi = m;
  }
  const a = Math.sqrt(lo * hi);
  // x₀ tal que la curva pase por (0, A.y) y (h, B.y)
  const x0 = h / 2 - a * Math.atanh(Math.max(-0.999999, Math.min(0.999999, v / L)));
  const c = A[1] - a * Math.cosh((0 - x0) / a);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = h * t;
    let y = a * Math.cosh((x - x0) / a) + c;
    if (ySuelo !== undefined) y = Math.max(ySuelo, y);
    out.set([A[0] + (dx * x) / h, y, A[2] + (dz * x) / h], i * 3);
  }
  return out;
}
