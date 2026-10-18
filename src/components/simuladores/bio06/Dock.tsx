'use client';
/**
 * bio06/Dock.tsx — el dock de instrumentos BAJO la escena, en DOM nítido (lienzos a
 * devicePixelRatio, tipografía del lab). Lee EL MISMO reloj que la escena: cada lienzo se redibuja
 * cuando el reloj integra un cuadro nuevo (una captura del ave baja la barra en ese cuadro).
 *
 *  · BOSQUE: la frecuencia del alelo C por generación con la banda de deriva (5–95 % de 240
 *    réplicas del mismo modelo) y la curva determinista p′ = p·w₁/w̄; los genotipos vivos y cazados
 *    de la temporada frente a Hardy–Weinberg; la supervivencia de cada forma frente al hollín.
 *  · RETO: q estimada (√ de la fracción de claras) por generación con la banda de lo que haría una
 *    caza AL AZAR (simétrica: no dice qué conviene cazar) y la caza de esta generación. La q real,
 *    la curva determinista con la presión que ejerció el alumno y su s sólo aparecen tras validar.
 *
 * Ancho < 760 px (p. ej. 1366×768 con el panel «Modelo» abierto, o un móvil): una gráfica cada vez,
 * con pestañas. Nunca hay scroll interno.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { seleccionDe, hardyWeinberg, hollinNeutro, type Conteo } from './seleccion';
import type { RelojBosque, RelojReto, VistaB6 } from './reloj';

// ───────────────────────────── formato ─────────────────────────────

const MENOS = '−';
/** Cifra con coma decimal, signo tipográfico y espacio fino (U+202F) en los millares (≥ 10 000). */
export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const [ent0, dec] = abs.split('.');
  const ent = ent0.length > 4 ? ent0.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ent0;
  const cuerpo = dec ? `${ent},${dec}` : ent;
  const cero = Number(abs) === 0;
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + cuerpo;
}

interface ConVersion { version: number }
/** Re-render a ≤ hz cuando el reloj integra un cuadro (o cambia de reloj). */
export function useTickReloj(reloj: React.MutableRefObject<ConVersion>, hz = 12): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimoR: ConVersion | null = null, t0 = 0;
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const r = reloj.current;
      if ((r.version !== ultimaV || r !== ultimoR) && ahora - t0 >= 1000 / hz) {
        ultimaV = r.version; ultimoR = r; t0 = ahora;
        setTick((n) => n + 1);
      }
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, [reloj, hz]);
  return tick;
}

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');
const COL = { fondo: '#0b1510', rejilla: 'rgba(170,200,180,0.11)', eje: 'rgba(180,205,190,0.5)', texto: 'rgba(226,236,230,0.92)', tenue: 'rgba(176,200,186,0.62)' };
export const COLOR = {
  C: '#f2b04b', banda: 'rgba(242,176,75,0.13)', banda2: 'rgba(242,176,75,0.22)', det: '#eef3ee',
  clara: '#efe6cf', oscura: '#9c95c9', cazada: '#ff8a70', hw: '#7cc8f0', neutra: 'rgba(124,200,240,0.16)', q: '#8fe3b0',
};

function pasoBonito(rango: number, n = 4) {
  const bruto = rango / Math.max(1, n);
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto) return k * p;
  return 10 * p;
}
function textoHalo(g: CanvasRenderingContext2D, txt: string, x: number, y: number) {
  const f = g.fillStyle;
  g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = 'rgba(11,21,16,0.92)';
  g.strokeText(txt, x, y);
  g.fillStyle = f; g.fillText(txt, x, y);
}

interface Marco { X: (v: number) => number; Y: (v: number) => number; x0: number; x1: number; y0: number; y1: number }
function ejes(g: CanvasRenderingContext2D, w: number, h: number, o: {
  xa: number; xb: number; ya: number; yb: number; xFmt?: (v: number) => string; yFmt?: (v: number) => string;
  xRot: string; yRot: string; izq?: number; xMarcas?: number[]; yMarcas?: number[];
}): Marco {
  const fam = familia();
  const izq = o.izq ?? 30, der = 8, arriba = 6, abajo = 15;
  const x0 = izq, x1 = w - der, y0 = arriba, y1 = h - abajo;
  const X = (v: number) => x0 + ((v - o.xa) / (o.xb - o.xa)) * (x1 - x0);
  const Y = (v: number) => y1 - ((v - o.ya) / (o.yb - o.ya)) * (y1 - y0);
  const xs = o.xMarcas ?? (() => { const p = pasoBonito(o.xb - o.xa, Math.max(2, Math.round((x1 - x0) / 64))); const out: number[] = []; for (let v = Math.ceil(o.xa / p) * p; v <= o.xb + 1e-9; v += p) out.push(v); return out; })();
  const ys = o.yMarcas ?? (() => { const p = pasoBonito(o.yb - o.ya, Math.max(1, Math.round((y1 - y0) / 30))); const out: number[] = []; for (let v = Math.ceil(o.ya / p) * p; v <= o.yb + 1e-9; v += p) out.push(v); return out; })();
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (const v of xs) { const x = Math.round(X(v)) + 0.5; g.moveTo(x, y0); g.lineTo(x, y1); }
  for (const v of ys) { const y = Math.round(Y(v)) + 0.5; g.moveTo(x0, y); g.lineTo(x1, y); }
  g.stroke();
  g.strokeStyle = COL.eje; g.beginPath(); g.moveTo(x0 + 0.5, y0); g.lineTo(x0 + 0.5, y1 + 0.5); g.lineTo(x1, y1 + 0.5); g.stroke();
  g.font = `600 9.5px ${fam}`;
  const anchoRot = g.measureText(o.xRot).width + 14;
  g.font = `500 9.5px ${fam}`; g.fillStyle = COL.tenue;
  g.textAlign = 'center'; g.textBaseline = 'top';
  const xf = o.xFmt ?? ((v: number) => cifra(v, 0));
  xs.forEach((v) => { const x = X(v); if (x > x1 - anchoRot) return; g.fillText(xf(v), x, y1 + 2); });
  g.textAlign = 'right'; g.textBaseline = 'middle';
  const yf = o.yFmt ?? ((v: number) => cifra(v, 0));
  for (const v of ys) g.fillText(yf(v), x0 - 3, Y(v));
  g.font = `600 9.5px ${fam}`; g.fillStyle = COL.texto;
  g.textAlign = 'right'; g.textBaseline = 'top'; textoHalo(g, o.xRot, x1, y1 + 2);
  g.textAlign = 'left'; g.textBaseline = 'top'; textoHalo(g, o.yRot, x0 + 4, y0 + 1);
  return { X, Y, x0, x1, y0, y1 };
}
function linea(g: CanvasRenderingContext2D, pts: [number, number][], color: string, ancho = 1.8, rayas: number[] = []) {
  if (pts.length < 2) return;
  g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(rayas); g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.setLineDash([]);
}
function punto(g: CanvasRenderingContext2D, x: number, y: number, color: string, r = 3.5, hueco = false) {
  g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  if (hueco) { g.strokeStyle = color; g.stroke(); } else { g.fillStyle = color; g.strokeStyle = '#08110c'; g.fill(); g.stroke(); }
}
function banda(g: CanvasRenderingContext2D, arriba: [number, number][], abajo: [number, number][], color: string) {
  if (arriba.length < 2) return;
  g.beginPath();
  arriba.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  for (let i = abajo.length - 1; i >= 0; i--) g.lineTo(abajo[i][0], abajo[i][1]);
  g.closePath(); g.fillStyle = color; g.fill();
}

function Lienzo({ reloj, dibujar, etiqueta, deps }: {
  reloj: React.MutableRefObject<ConVersion>; dibujar: (g: CanvasRenderingContext2D, w: number, h: number) => void; etiqueta: string; deps: unknown[];
}) {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = caja.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fn = useRef(dibujar); fn.current = dibujar;
  // si cambian los datos del dibujo (la lista puede cambiar de largo entre vistas), se redibuja
  const prev = useRef<unknown[]>([]);
  const forzar = useRef(true);
  useLayoutEffect(() => {
    const p = prev.current;
    if (deps.length !== p.length || deps.some((d, i) => !Object.is(d, p[i]))) { prev.current = deps; forzar.current = true; }
  });
  useEffect(() => {
    const c = lienzo.current; if (!c || tam.w < 20 || tam.h < 20) return;
    let id = 0, ultima = -1, ultimoR: ConVersion | null = null;
    forzar.current = true;
    const bucle = () => {
      id = requestAnimationFrame(bucle);
      const r = reloj.current;
      if (!forzar.current && r.version === ultima && r === ultimoR) return;
      forzar.current = false; ultima = r.version; ultimoR = r;
      const dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
      const W = Math.round(tam.w * dpr), H = Math.round(tam.h * dpr);
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      const g = c.getContext('2d'); if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = COL.fondo; g.fillRect(0, 0, tam.w, tam.h);
      fn.current(g, tam.w, tam.h);
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, [reloj, tam.w, tam.h]);
  return (
    <div ref={caja} className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-black/40">
      <canvas ref={lienzo} className="absolute inset-0 h-full w-full" role="img" aria-label={etiqueta} />
    </div>
  );
}

function Panel({ titulo, dato, children, cabecera }: { titulo: string; dato?: React.ReactNode; children: React.ReactNode; cabecera?: React.ReactNode }) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
      <header className="flex h-[20px] shrink-0 items-center justify-between gap-2">
        {cabecera ?? <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">{titulo}</span>}
        {dato && <span className="truncate whitespace-nowrap font-mono text-[10.5px] tabular-nums text-slate-200">{dato}</span>}
      </header>
      {children}
    </section>
  );
}

function useAncho(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(1200);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

// ───────────────────────────── bosque ─────────────────────────────

function ventanaGen(gen: number) {
  const xb = Math.max(24, gen + 8);
  return { xa: Math.max(0, xb - 40), xb };
}

function dibujarFrecuencia(g: CanvasRenderingContext2D, w: number, h: number, r: RelojBosque) {
  const { xa, xb } = ventanaGen(r.gen);
  const m = ejes(g, w, h, { xa, xb, ya: 0, yb: 1, xRot: 'generación (año)', yRot: 'p(C)', yMarcas: [0, 0.5, 1], yFmt: (v) => cifra(v, 1), izq: 28 });
  const { X, Y } = m;
  const pr = r.pronostico;
  if (pr) {
    const vis = pr.cuantiles.filter((c) => c.g >= xa && c.g <= xb);
    banda(g, vis.map((c) => [X(c.g), Y(c.p95)]), vis.map((c) => [X(c.g), Y(c.p05)]), COLOR.banda);
    banda(g, vis.map((c) => [X(c.g), Y(c.p75)]), vis.map((c) => [X(c.g), Y(c.p25)]), COLOR.banda2);
    const det: [number, number][] = [];
    pr.det.forEach((p, k) => { const gg = pr.g0 + k; if (gg >= xa && gg <= xb) det.push([X(gg), Y(p)]); });
    linea(g, det, COLOR.det, 1.3, [5, 4]);
  }
  // la población que se ve: un punto por generación y, dentro de la temporada, p de las vivas
  const hist = r.historia.filter((p) => p.g >= xa - 1);
  linea(g, hist.map((p) => [X(p.g), Y(p.p)]), COLOR.C, 2);
  for (const p of hist) if (p.g >= xa) punto(g, X(p.g), Y(p.p), COLOR.C, 2.6);
  const u = r.historia[r.historia.length - 1];
  if (u && r.fase === 'dia') {
    const frac = Math.min(0.98, Math.max(0, (r.t - r.tFase) / Math.max(1, r.durDia)));
    const xv = X(u.g + frac), yv = Y(r.temporada.pVivas);
    linea(g, [[X(u.g), Y(u.p)], [xv, yv]], `${COLOR.C}99`, 1.2, [2, 2]);
    punto(g, xv, yv, COLOR.C, 4.5, true);
  }
}

function dibujarGenotipos(g: CanvasRenderingContext2D, w: number, h: number, r: RelojBosque) {
  const fam = familia();
  const t = r.temporada;
  const N = t.inicial.CC + t.inicial.Cc + t.inicial.cc;
  const p = r.pC;
  const hw = hardyWeinberg(p).map((f) => f * N);
  const yb = Math.max(4, Math.ceil(Math.max(N * 0.75, t.inicial.CC, t.inicial.Cc, t.inicial.cc, ...hw) / 5) * 5);
  const m = ejes(g, w, h, { xa: 0, xb: 3, ya: 0, yb, xRot: '', yRot: 'polillas', xMarcas: [], izq: 26 });
  const claves: (keyof Conteo)[] = ['CC', 'Cc', 'cc'];
  const ancho = (m.x1 - m.x0) / 3;
  claves.forEach((k, i) => {
    const cx = m.x0 + ancho * (i + 0.5), bw = Math.min(46, ancho * 0.5);
    const vivas = t.vivas[k], caz = t.cazadas[k];
    const color = k === 'cc' ? COLOR.clara : COLOR.oscura;
    // vivas (sólido) y, encima, las cazadas de esta temporada (rayado)
    g.fillStyle = color; g.globalAlpha = 0.9;
    g.fillRect(cx - bw / 2, m.Y(vivas), bw, m.Y(0) - m.Y(vivas));
    g.globalAlpha = 1;
    if (caz > 0) {
      const y0 = m.Y(vivas + caz), y1 = m.Y(vivas);
      g.save(); g.beginPath(); g.rect(cx - bw / 2, y0, bw, y1 - y0); g.clip();
      g.fillStyle = 'rgba(255,138,112,0.18)'; g.fillRect(cx - bw / 2, y0, bw, y1 - y0);
      g.strokeStyle = COLOR.cazada; g.lineWidth = 1;
      for (let s = -bw; s < bw + (y1 - y0); s += 5) { g.beginPath(); g.moveTo(cx - bw / 2 + s, y0); g.lineTo(cx - bw / 2 + s - (y1 - y0), y1); g.stroke(); }
      g.restore();
      g.strokeStyle = COLOR.cazada; g.strokeRect(cx - bw / 2 + 0.5, y0 + 0.5, bw - 1, y1 - y0 - 1);
    }
    // Hardy–Weinberg esperado al nacer
    const yh = m.Y(hw[i]);
    g.strokeStyle = COLOR.hw; g.lineWidth = 2; g.setLineDash([3, 2]);
    g.beginPath(); g.moveTo(cx - bw / 2 - 5, yh); g.lineTo(cx + bw / 2 + 5, yh); g.stroke(); g.setLineDash([]);
    g.font = `700 10px ${fam}`; g.fillStyle = COL.texto; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillText(k, cx, m.y1 + 2);
  });
  g.font = `600 9.5px ${fam}`; g.textAlign = 'right'; g.textBaseline = 'top';
  g.fillStyle = COLOR.hw; textoHalo(g, 'HW p², 2pq, q²', m.x1 - 2, m.y0 + 1);
  g.fillStyle = COLOR.cazada; textoHalo(g, 'cazadas', m.x1 - 2, m.y0 + 13);
}

function dibujarSupervivencia(g: CanvasRenderingContext2D, w: number, h: number, r: RelojBosque) {
  const fam = familia();
  const m = ejes(g, w, h, { xa: 0, xb: 100, ya: 0, yb: 1, xRot: 'hollín (%)', yRot: 'v (sobrevive)', yMarcas: [0, 0.5, 1], yFmt: (v) => cifra(v, 1), xMarcas: [0, 25, 50, 75, 100], izq: 28 });
  const { X, Y } = m;
  const aves = r.aves;
  const neutro = hollinNeutro() * 100;
  g.setLineDash([2, 3]); g.strokeStyle = 'rgba(200,220,210,0.35)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(Math.round(X(neutro)) + 0.5, m.y0); g.lineTo(Math.round(X(neutro)) + 0.5, m.y1); g.stroke(); g.setLineDash([]);
  const cl: [number, number][] = [], os: [number, number][] = [];
  for (let k = 0; k <= 100; k += 2) { const s = seleccionDe(k / 100, aves); cl.push([X(k), Y(s.vClara)]); os.push([X(k), Y(s.vOscura)]); }
  linea(g, cl, COLOR.clara, 2);
  linea(g, os, COLOR.oscura, 2);
  const s = r.seleccion, hx = X(r.hollin * 100);
  g.strokeStyle = 'rgba(242,176,75,0.7)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(Math.round(hx) + 0.5, m.y0); g.lineTo(Math.round(hx) + 0.5, m.y1); g.stroke();
  punto(g, hx, Y(s.vClara), COLOR.clara, 3.6);
  punto(g, hx, Y(s.vOscura), COLOR.oscura, 3.6);
  g.font = `700 9.5px ${fam}`; g.textBaseline = 'bottom'; g.textAlign = 'left';
  g.fillStyle = COLOR.clara; textoHalo(g, 'clara', X(4), Y(seleccionDe(0.04, aves).vClara) - 3);
  g.fillStyle = COLOR.oscura; textoHalo(g, 'oscura', X(4), Y(seleccionDe(0.04, aves).vOscura) - 3);
  if (aves === 0) { g.fillStyle = COL.tenue; g.textAlign = 'center'; textoHalo(g, 'sin aves: sólo deriva', (m.x0 + m.x1) / 2, Y(0.55)); }
}

// ───────────────────────────── reto ─────────────────────────────

export interface DatosRetoB6 {
  /** q estimada por generación (lo que mide el alumno) */
  puntos: { g: number; q: number }[];
  /** banda neutra (caza al azar) */
  banda: { g: number; p05: number; p50: number; p95: number }[];
  /** tras validar */
  qReal?: { g: number; q: number }[];
  det?: { g: number; q: number }[];
  s?: number;
  conspicua?: 'clara' | 'oscura';
  /** esta generación, por fenotipo */
  vivas: { clara: number; oscura: number };
  cazadas: { clara: number; oscura: number };
  genotipos?: Conteo;
  cuota: number;
}

function dibujarQ(g: CanvasRenderingContext2D, w: number, h: number, d: DatosRetoB6) {
  const fam = familia();
  const m = ejes(g, w, h, { xa: 1, xb: 7, ya: 0, yb: 1, xRot: 'generación', yRot: 'q (alelo c)', xMarcas: [1, 2, 3, 4, 5, 6, 7], yMarcas: [0, 0.5, 1], yFmt: (v) => cifra(v, 1), izq: 28 });
  const { X, Y } = m;
  const b = d.banda.map((c) => ({ ...c, g: c.g + 1 }));
  banda(g, b.map((c) => [X(c.g), Y(c.p95)]), b.map((c) => [X(c.g), Y(c.p05)]), COLOR.neutra);
  linea(g, b.map((c) => [X(c.g), Y(c.p50)]), 'rgba(124,200,240,0.55)', 1, [3, 3]);
  if (d.det) linea(g, d.det.map((p) => [X(p.g), Y(p.q)]), COLOR.det, 1.4, [5, 4]);
  if (d.qReal) { linea(g, d.qReal.map((p) => [X(p.g), Y(p.q)]), COLOR.C, 1.6); for (const p of d.qReal) punto(g, X(p.g), Y(p.q), COLOR.C, 2.4); }
  linea(g, d.puntos.map((p) => [X(p.g), Y(p.q)]), COLOR.q, 2);
  for (const p of d.puntos) punto(g, X(p.g), Y(p.q), COLOR.q, 3.4);
  g.font = `600 9.5px ${fam}`; g.textAlign = 'right'; g.textBaseline = 'top';
  g.fillStyle = 'rgba(124,200,240,0.9)'; textoHalo(g, 'caza al azar (deriva)', m.x1 - 2, m.y0 + 1);
  if (d.qReal) { g.fillStyle = COLOR.C; textoHalo(g, 'q real (genotipos)', m.x1 - 2, m.y0 + 13); }
}

function dibujarCaza(g: CanvasRenderingContext2D, w: number, h: number, d: DatosRetoB6) {
  const fam = familia();
  const total = d.vivas.clara + d.vivas.oscura + d.cazadas.clara + d.cazadas.oscura;
  const m = ejes(g, w, h, { xa: 0, xb: 2, ya: 0, yb: Math.max(10, Math.ceil(total / 10) * 10), xRot: '', yRot: 'polillas', xMarcas: [], izq: 26 });
  (['oscura', 'clara'] as const).forEach((f, i) => {
    const ancho = (m.x1 - m.x0) / 2, cx = m.x0 + ancho * (i + 0.5), bw = Math.min(54, ancho * 0.45);
    const vivas = d.vivas[f], caz = d.cazadas[f];
    g.fillStyle = f === 'clara' ? COLOR.clara : COLOR.oscura; g.globalAlpha = 0.9;
    g.fillRect(cx - bw / 2, m.Y(vivas), bw, m.Y(0) - m.Y(vivas)); g.globalAlpha = 1;
    if (caz > 0) {
      const y0 = m.Y(vivas + caz), y1 = m.Y(vivas);
      g.fillStyle = 'rgba(255,138,112,0.2)'; g.fillRect(cx - bw / 2, y0, bw, y1 - y0);
      g.strokeStyle = COLOR.cazada; g.lineWidth = 1.2; g.strokeRect(cx - bw / 2 + 0.5, y0 + 0.5, bw - 1, y1 - y0 - 1);
    }
    g.font = `700 10px ${fam}`; g.fillStyle = COL.texto; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillText(f === 'clara' ? 'claras' : 'oscuras', cx, m.y1 + 2);
    g.textBaseline = 'bottom'; g.font = `600 10px ${fam}`;
    textoHalo(g, `${vivas}${caz ? ` + ${caz}` : ''}`, cx, m.Y(vivas + caz) - 2);
  });
  if (d.genotipos) {
    const c = d.genotipos;
    g.font = `600 9.5px ${fam}`; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillStyle = COLOR.hw;
    textoHalo(g, `CC ${c.CC} · Cc ${c.Cc} · cc ${c.cc}`, m.x1 - 2, m.y0 + 1);
  }
}

// ───────────────────────────── dock ─────────────────────────────

export interface DockB6Props {
  vista: VistaB6;
  relojB: React.MutableRefObject<RelojBosque>;
  relojR: React.MutableRefObject<RelojReto>;
  reto: DatosRetoB6;
  revela: boolean;
}

type PanelB = 'frecuencia' | 'genotipos' | 'supervivencia';
type PanelR = 'q' | 'caza';
const NOMBRE_B: Record<PanelB, string> = { frecuencia: 'Alelo C', genotipos: 'Genotipos', supervivencia: 'Supervivencia' };
const NOMBRE_R: Record<PanelR, string> = { q: 'q por generación', caza: 'Esta generación' };

function Pestanas<T extends string>({ valor, opciones, nombres, onChange }: { valor: T; opciones: T[]; nombres: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5" role="tablist">
      {opciones.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={valor === o} onClick={() => onChange(o)}
          className={`h-5 rounded-full px-2 text-[10px] font-semibold ${valor === o ? 'bg-[#2f8f5b] text-white' : 'text-slate-300 hover:text-white'}`}>
          {nombres[o]}
        </button>
      ))}
    </div>
  );
}

export function DockB6({ vista, relojB, relojR, reto, revela }: DockB6Props) {
  const caja = useRef<HTMLDivElement>(null);
  const ancho = useAncho(caja);
  const estrecho = ancho < 760;
  const compacto = ancho < 560;
  const enReto = vista === 'reto';
  const reloj = (enReto ? relojR : relojB) as unknown as React.MutableRefObject<ConVersion>;
  useTickReloj(reloj, 8);
  const [pb, setPb] = useState<PanelB>('frecuencia');
  const [pr, setPr] = useState<PanelR>('q');
  const B = relojB.current;
  const t = B.temporada;
  const vivas = t.vivas.CC + t.vivas.Cc + t.vivas.cc, nIni = t.inicial.CC + t.inicial.Cc + t.inicial.cc;
  const pron = B.pronostico;
  const fija = pron ? (pron.fijaC > 0 ? `fija C ${cifra(pron.fijaC * 100, 0)} %${Number.isFinite(pron.tFijaC) ? ` · ~${cifra(pron.tFijaC, 0)} gen` : ''}` : `pierde C ${cifra(pron.pierdeC * 100, 0)} %`) : '';
  const sel = B.seleccion;
  const panelesB: Record<PanelB, (c?: React.ReactNode) => React.ReactNode> = {
    frecuencia: (c) => (
      <Panel cabecera={c} titulo="Alelo C (oscuro)" dato={<span title="Frecuencia del alelo C ahora · réplicas que lo fijan y tiempo medio">p {cifra(B.pC, 2)}{fija && !compacto ? ` · ${fija}` : ''}</span>}>
        <Lienzo reloj={reloj} etiqueta="Frecuencia del alelo C por generación, con la banda de deriva de 240 réplicas y la curva determinista de la ecuación de la selección" deps={[vista]}
          dibujar={(g, w, h) => dibujarFrecuencia(g, w, h, relojB.current)} />
      </Panel>
    ),
    genotipos: (c) => (
      <Panel cabecera={c} titulo="Genotipos" dato={`vivas ${vivas}/${nIni}`}>
        <Lienzo reloj={reloj} etiqueta="Polillas vivas y cazadas de cada genotipo en esta temporada, frente a Hardy–Weinberg" deps={[vista]}
          dibujar={(g, w, h) => dibujarGenotipos(g, w, h, relojB.current)} />
      </Panel>
    ),
    supervivencia: (c) => (
      <Panel cabecera={c} titulo="Supervivencia" dato={sel.favorecido ? `s ${cifra(sel.s, 2)} contra la ${sel.favorecido === 'clara' ? 'oscura' : 'clara'}` : 's 0'}>
        <Lienzo reloj={reloj} etiqueta="Supervivencia de cada forma frente al hollín de la corteza, con el punto de hoy" deps={[vista]}
          dibujar={(g, w, h) => dibujarSupervivencia(g, w, h, relojB.current)} />
      </Panel>
    ),
  };
  const ultimoQ = reto.puntos[reto.puntos.length - 1];
  const panelesR: Record<PanelR, (c?: React.ReactNode) => React.ReactNode> = {
    q: (c) => (
      <Panel cabecera={c} titulo="q estimada por generación" dato={revela && reto.s !== undefined ? `tu caza: s ${cifra(reto.s, 2)} contra la ${reto.conspicua}` : ultimoQ ? `q ${cifra(ultimoQ.q, 2)}` : undefined}>
        <Lienzo reloj={reloj} etiqueta="q estimada a partir de las claras en cada generación, con la banda de lo que daría una caza al azar" deps={[vista, reto, revela]}
          dibujar={(g, w, h) => dibujarQ(g, w, h, reto)} />
      </Panel>
    ),
    caza: (c) => (
      <Panel cabecera={c} titulo="Esta generación" dato={`cazadas ${reto.cazadas.clara + reto.cazadas.oscura}/${reto.cuota}`}>
        <Lienzo reloj={reloj} etiqueta="Polillas vivas y cazadas de cada forma en esta generación" deps={[vista, reto]}
          dibujar={(g, w, h) => dibujarCaza(g, w, h, reto)} />
      </Panel>
    ),
  };
  return (
    <div ref={caja} className={`flex shrink-0 flex-col border-t border-white/10 bg-[#0c1611] ${compacto ? 'h-[150px] p-1.5' : 'h-[clamp(132px,25%,200px)] p-2'}`}
      data-dock-b6={enReto ? 'reto' : 'bosque'} data-estrecho={estrecho ? '' : undefined}>
      {estrecho ? (
        <div className="flex min-h-0 flex-1">
          {enReto
            ? panelesR[pr](<Pestanas<PanelR> valor={pr} opciones={['q', 'caza']} nombres={NOMBRE_R} onChange={setPr} />)
            : panelesB[pb](<Pestanas<PanelB> valor={pb} opciones={['frecuencia', 'genotipos', 'supervivencia']} nombres={NOMBRE_B} onChange={setPb} />)}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-2.5">
          {enReto
            ? (['q', 'caza'] as PanelR[]).map((k) => <React.Fragment key={k}>{panelesR[k]()}</React.Fragment>)
            : (['frecuencia', 'genotipos', 'supervivencia'] as PanelB[]).map((k) => <React.Fragment key={k}>{panelesB[k]()}</React.Fragment>)}
        </div>
      )}
    </div>
  );
}
