'use client';
/**
 * fis01/Dock.tsx — el dock DOM bajo el polígono. Lienzos 2D a devicePixelRatio que leen EL
 * MISMO reloj que la escena (cada cuadro integrado avisa y el dock se redibuja con ese estado).
 *
 *  · Cifras: t, x, y, vx, vy y la energía mecánica E/E₀ del balín ahora; R, H y T del disparo.
 *    En el reto, R, H y T sólo cuando el balín ya cayó (antes, «—»).
 *  · y(x): la trayectoria a escala real (1 m = 1 m en los dos ejes), las imágenes del
 *    estroboscopio y sus dos proyecciones: en el eje x (sombra del suelo, rayas equiespaciadas
 *    sin aire) y en el eje y (sombra de la pantalla, apiñadas arriba). En el reto, el mapa de la
 *    misión y los disparos ya hechos (nunca uno que no se ha lanzado).
 *  · x(t), y(t) y vx(t), vy(t) con el mismo reloj: el cursor es el instante de la escena.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RADIO_DIANA } from '@/domain/fisica';
import type { RelojTiro } from './reloj';
import { estadoEn, type Trayectoria, type EstadoTiro } from './balistica';
import { cifra } from './formato';

// ───────────────────────────── utilidades ─────────────────────────────

function useTamano<T extends HTMLElement>(): [React.RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [t, setT] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setT({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, t];
}

function preparar(cv: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext('2d');
  if (!g) return null;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#0a1220'; g.fillRect(0, 0, w, h);
  return g;
}

const FUENTE = (px: number, peso = 500) => `${peso} ${px}px Outfit, system-ui, sans-serif`;
export const COL = {
  rejilla: 'rgba(148,180,205,0.12)', cero: 'rgba(170,196,214,0.35)', texto: 'rgba(214,228,240,0.88)', tenue: 'rgba(170,196,214,0.55)',
  tray: '#fff2d6', vacio: '#9fd2ff', comp: '#d2b6ff', x: '#ffb547', y: '#5fe0c4', bola: '#ffffff',
  muro: '#b9b3a8', diana: '#e0483f', torre: '#8f9aa5', hist: 'rgba(255,242,214,0.30)',
};

function pasoBonito(rango: number, n = 4) {
  const bruto = rango / n;
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto) return k * p;
  return 10 * p;
}

interface Panel { x0: number; x1: number; y0: number; y1: number; a0: number; a1: number; v0: number; v1: number }
const PX = (p: Panel, a: number) => p.x0 + ((a - p.a0) / (p.a1 - p.a0)) * (p.x1 - p.x0);
const PY = (p: Panel, v: number) => p.y1 - ((v - p.v0) / (p.v1 - p.v0)) * (p.y1 - p.y0);

function leyenda(g: CanvasRenderingContext2D, x: number, y: number, items: [string, string, boolean?][], maxX: number) {
  g.font = FUENTE(10, 600); g.textBaseline = 'middle'; g.textAlign = 'left';
  let cx = x;
  for (const [t, c, rayada] of items) {
    const ancho = 22 + g.measureText(t).width;
    if (cx + ancho - 6 > maxX) break;
    g.strokeStyle = c; g.lineWidth = 2;
    g.setLineDash(rayada ? [3, 2.5] : []);
    g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + 12, y); g.stroke();
    g.setLineDash([]);
    g.fillStyle = COL.texto; g.fillText(t, cx + 16, y);
    cx += ancho;
  }
}

function recortar(g: CanvasRenderingContext2D, p: Panel) {
  g.save(); g.beginPath(); g.rect(p.x0, p.y0 - 3, p.x1 - p.x0, p.y1 - p.y0 + 6); g.clip();
}

function titulo(g: CanvasRenderingContext2D, x: number, t: string): number {
  g.font = FUENTE(10.5, 700); g.fillStyle = COL.texto; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(t, x, 9);
  return x + g.measureText(t).width + 10;
}

const tmp: EstadoTiro = { t: 0, x: 0, y: 0, vx: 0, vy: 0 };

/** Traza una magnitud de la trayectoria de 0 a tHasta (muestras del integrador + el punto exacto en tHasta). */
function trazar(g: CanvasRenderingContext2D, tr: Trayectoria, tHasta: number, fx: (m: EstadoTiro) => number, fy: (m: EstadoTiro) => number, color: string, ancho: number, rayas: number[] = []) {
  const ms = tr.muestras;
  if (ms.length === 0) return;
  g.strokeStyle = color; g.lineWidth = ancho; g.lineJoin = 'round'; g.setLineDash(rayas);
  g.beginPath();
  g.moveTo(fx(ms[0]), fy(ms[0]));
  let i = 1;
  for (; i < ms.length && ms[i].t <= tHasta; i++) g.lineTo(fx(ms[i]), fy(ms[i]));
  if (i < ms.length && tHasta > 0) { const e = estadoEn(tr, tHasta, tmp); g.lineTo(fx(e), fy(e)); }
  g.stroke(); g.setLineDash([]);
}

/** Lo que el reloj enseña ahora: el disparo, hasta dónde y si ya cayó. */
function situacion(r: RelojTiro) {
  const tr = r.tiro;
  const t = tr ? Math.min(r.t, tr.T) : 0;
  const cayo = !!tr && r.fase !== 'vuelo' && t >= tr.T - 1e-9;
  return { tr, t, cayo };
}

// ───────────────────────────── y(x) ─────────────────────────────

function dibujarTrayectoria(cv: HTMLCanvasElement, w: number, h: number, r: RelojTiro, comp: boolean, reserva = 0) {
  const g = preparar(cv, w, h); if (!g) return;
  const { tr, t, cayo } = situacion(r);
  const banco = r.modo === 'banco';
  const m = r.mision;
  // dominio (m)
  let xMin = 0, xMax = 10, yMax = 4;
  if (banco) {
    for (const q of [tr, r.vacio, comp ? r.comp : null]) if (q) { xMax = Math.max(xMax, q.vuelo.hitX); yMax = Math.max(yMax, q.vuelo.maxY); }
    xMin = -0.04 * xMax;
  } else if (m) {
    xMin = -3.5;
    xMax = Math.max(m.targetX + RADIO_DIANA + 4, m.obsX + 4);
    yMax = Math.max(m.y0, m.obsY) + 3;
    for (const q of r.historial) { xMax = Math.max(xMax, Math.min(q.vuelo.hitX + 2, 1.6 * m.targetX)); yMax = Math.max(yMax, Math.min(q.vuelo.maxY + 2, 3 * Math.max(m.y0, m.obsY))); }
  }
  const izq = 30, der = 10, arriba = 22, abajo = 16;
  const anchoU = w - izq - der, altoU = h - arriba - abajo;
  const spanX = (xMax - xMin) * (banco ? 1.16 : 1.04), spanY = yMax * 1.08;
  const s = Math.max(0.01, Math.min(anchoU / spanX, altoU / spanY));    // px por metro, igual en x y en y
  const P: Panel = { x0: izq, x1: izq + spanX * s, y0: h - abajo - spanY * s, y1: h - abajo, a0: xMin, a1: xMin + spanX, v0: 0, v1: spanY };
  // rejilla
  const paso = pasoBonito(Math.max(spanX, spanY * (anchoU / Math.max(1, altoU))), Math.max(3, Math.round(anchoU / 70)));
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (let x = Math.ceil(P.a0 / paso) * paso; x <= P.a1 + 1e-9; x += paso) { const X = Math.round(PX(P, x)) + 0.5; g.moveTo(X, P.y0); g.lineTo(X, P.y1); }
  for (let y = paso; y <= P.v1 + 1e-9; y += paso) { const Y = Math.round(PY(P, y)) + 0.5; g.moveTo(P.x0, Y); g.lineTo(P.x1, Y); }
  g.stroke();
  g.strokeStyle = COL.cero; g.beginPath(); { const Y = Math.round(PY(P, 0)) + 0.5; g.moveTo(P.x0, Y); g.lineTo(P.x1, Y); } g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'center'; g.textBaseline = 'top';
  for (let x = Math.max(0, Math.ceil(P.a0 / paso) * paso); x <= P.a1 + 1e-9; x += paso) g.fillText(cifra(x, 0), PX(P, x), P.y1 + 2);
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let y = paso; y <= P.v1 + 1e-9; y += paso) g.fillText(cifra(y, 0), P.x0 - 4, PY(P, y));

  recortar(g, P);
  // misión: torre, muro y diana
  if (!banco && m) {
    g.fillStyle = 'rgba(143,154,165,0.35)'; g.fillRect(PX(P, -3.2), PY(P, m.y0), PX(P, 0) - PX(P, -3.2), PY(P, 0) - PY(P, m.y0));
    g.fillStyle = 'rgba(185,179,168,0.55)'; g.fillRect(PX(P, m.obsX), PY(P, m.obsY), Math.max(2, 1.2 * s), PY(P, 0) - PY(P, m.obsY));
    g.strokeStyle = COL.diana; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(PX(P, m.targetX - RADIO_DIANA), PY(P, 0)); g.lineTo(PX(P, m.targetX + RADIO_DIANA), PY(P, 0)); g.stroke();
    g.lineCap = 'butt';
    g.fillStyle = COL.diana; g.beginPath(); g.arc(PX(P, m.targetX), PY(P, 0) - 4, 2.6, 0, Math.PI * 2); g.fill();
    // disparos anteriores de esta misión
    for (const q of r.historial) if (q !== tr) trazar(g, q, q.T, (e) => PX(P, e.x), (e) => PY(P, e.y), COL.hist, 1.2);
  }
  if (banco) {
    if (r.vacio) trazar(g, r.vacio, r.vacio.T, (e) => PX(P, e.x), (e) => PY(P, e.y), COL.vacio, 1.3, [5, 4]);
    if (comp && r.comp) trazar(g, r.comp, r.comp.T, (e) => PX(P, e.x), (e) => PY(P, e.y), COL.comp, 1.3, [5, 4]);
    // el banco ya conoce la curva entera: tenue debajo de la que crece
    if (tr) trazar(g, tr, tr.T, (e) => PX(P, e.x), (e) => PY(P, e.y), 'rgba(255,242,214,0.22)', 1.4);
  }
  if (tr) {
    trazar(g, tr, t, (e) => PX(P, e.x), (e) => PY(P, e.y), COL.tray, 2);
    // estroboscopio y sus proyecciones en los ejes
    const n = Math.min(r.marcas.length, r.marcasVisibles);
    const yEje = PY(P, 0), xEje = P.x0;
    for (let i = 0; i < n; i++) {
      const k = r.marcas[i];
      const X = PX(P, k.x), Y = PY(P, k.y);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(X, Y, 2.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.x; g.fillRect(Math.round(X) - 1, yEje - 5, 2, 5);
      if (k.y >= 0) { g.fillStyle = COL.y; g.fillRect(xEje, Math.round(Y) - 1, 5, 2); }
    }
    // el balín ahora y sus dos sombras
    const e = estadoEn(tr, t, tmp);
    const X = PX(P, e.x), Y = PY(P, e.y);
    g.strokeStyle = 'rgba(255,181,71,0.35)'; g.lineWidth = 1; g.setLineDash([2, 3]);
    g.beginPath(); g.moveTo(X, Y); g.lineTo(X, yEje); g.stroke();
    g.strokeStyle = 'rgba(95,224,196,0.35)';
    g.beginPath(); g.moveTo(X, Y); g.lineTo(xEje, Y); g.stroke(); g.setLineDash([]);
    g.fillStyle = COL.x; g.beginPath(); g.arc(X, yEje, 3.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = COL.y; g.beginPath(); g.arc(xEje + 1, Y, 3.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = COL.bola; g.beginPath(); g.arc(X, Y, 3.6, 0, Math.PI * 2); g.fill();
    // alcance (en el reto, sólo ya caído)
    if (cayo || banco) {
      const xr = tr.vuelo.hitX;
      g.font = FUENTE(9.5, 700); g.textBaseline = 'bottom';
      // alcance con aire (dentro de la curva) y, en el banco, el del vacío (por fuera)
      if (banco && r.vacio) {
        g.fillStyle = COL.vacio; g.textAlign = 'left';
        g.fillText(cifra(r.vacio.vuelo.hitX, 1), PX(P, r.vacio.vuelo.hitX) + 3, yEje - 7);
      }
      g.fillStyle = COL.tray; g.textAlign = 'right';
      if (tr.vuelo.fin === 'suelo') g.fillText(`${cifra(xr, 1)} m`, PX(P, xr) - 3, yEje - 7);
    }
  }
  g.restore();
  // título y leyenda
  const ini = titulo(g, izq, 'y(x) · m');
  const items: [string, string, boolean?][] = banco
    ? [['estela', COL.tray], ...(r.vacio ? [['sin aire', COL.vacio, true]] as [string, string, boolean][] : []), ...(comp ? [[`${cifra(90 - r.p.angulo, 0)}°`, COL.comp, true]] as [string, string, boolean][] : []), ['sombra x', COL.x], ['sombra y', COL.y]]
    : [['disparo', COL.tray], ['anteriores', COL.hist], ['diana', COL.diana]];
  leyenda(g, ini, 9, items, w - der - reserva);
}

// ───────────────────────────── x(t), y(t) · vx(t), vy(t) ─────────────────────────────

function dibujarTiempo(cv: HTMLCanvasElement, w: number, h: number, r: RelojTiro, cual: 'pos' | 'vel', reserva = 0) {
  const g = preparar(cv, w, h); if (!g) return;
  const { tr, t } = situacion(r);
  const banco = r.modo === 'banco';
  const izq = 34, der = 10, arriba = 22, abajo = 16;
  const nombre = cual === 'pos' ? 'x(t), y(t) · m' : 'vx(t), vy(t) · m/s';
  if (!tr || tr.T <= 0) {
    titulo(g, izq, nombre);
    g.font = FUENTE(11, 600); g.fillStyle = COL.tenue; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Aún sin disparo', w / 2, h / 2 + 6);
    return;
  }
  const fant = banco ? r.vacio : null;
  const T = Math.max(tr.T, fant?.T ?? 0);
  // rango vertical
  let lo = 0, hi = 1;
  for (const q of [tr, fant]) if (q) for (const m of q.muestras) {
    if (cual === 'pos') { hi = Math.max(hi, m.x, m.y); lo = Math.min(lo, m.y); }
    else { hi = Math.max(hi, m.vx, m.vy); lo = Math.min(lo, m.vx, m.vy); }
  }
  const margen = (hi - lo) * 0.08;
  hi += margen; if (lo < 0) lo -= margen;
  const P: Panel = { x0: izq, x1: w - der, y0: arriba, y1: h - abajo, a0: 0, a1: T, v0: lo, v1: hi };
  const paso = pasoBonito(hi - lo, 3);
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (let v = Math.ceil(lo / paso) * paso; v <= hi + 1e-9; v += paso) { const Y = Math.round(PY(P, v)) + 0.5; g.moveTo(P.x0, Y); g.lineTo(P.x1, Y); }
  const pt = pasoBonito(T, Math.max(2, Math.round((P.x1 - P.x0) / 70)));
  for (let s = pt; s <= T + 1e-9; s += pt) { const X = Math.round(PX(P, s)) + 0.5; g.moveTo(X, P.y0); g.lineTo(X, P.y1); }
  g.stroke();
  g.strokeStyle = COL.cero; g.beginPath(); { const Y = Math.round(PY(P, 0)) + 0.5; g.moveTo(P.x0, Y); g.lineTo(P.x1, Y); } g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let v = Math.ceil(lo / paso) * paso; v <= hi + 1e-9; v += paso) g.fillText(cifra(v, 0), P.x0 - 4, PY(P, v));
  g.textAlign = 'center'; g.textBaseline = 'top';
  const dec = pt < 0.1 ? 2 : pt < 1 ? 1 : 0;
  for (let s = 0; s <= T + 1e-9; s += pt) if (PX(P, s) < P.x1 - 16) g.fillText(cifra(s, dec), PX(P, s) + (s === 0 ? 4 : 0), P.y1 + 2);
  g.textAlign = 'right'; g.fillText('s', P.x1, P.y1 + 2);

  recortar(g, P);
  const fX = (e: EstadoTiro) => PX(P, e.t);
  if (cual === 'pos') {
    if (fant) { trazar(g, fant, fant.T, fX, (e) => PY(P, e.x), 'rgba(255,181,71,0.5)', 1.1, [4, 3]); trazar(g, fant, fant.T, fX, (e) => PY(P, e.y), 'rgba(95,224,196,0.5)', 1.1, [4, 3]); }
    if (banco) { trazar(g, tr, tr.T, fX, (e) => PY(P, e.x), 'rgba(255,181,71,0.25)', 1.3); trazar(g, tr, tr.T, fX, (e) => PY(P, e.y), 'rgba(95,224,196,0.25)', 1.3); }
    trazar(g, tr, t, fX, (e) => PY(P, e.x), COL.x, 2);
    trazar(g, tr, t, fX, (e) => PY(P, e.y), COL.y, 2);
  } else {
    if (fant) { trazar(g, fant, fant.T, fX, (e) => PY(P, e.vx), 'rgba(255,181,71,0.5)', 1.1, [4, 3]); trazar(g, fant, fant.T, fX, (e) => PY(P, e.vy), 'rgba(95,224,196,0.5)', 1.1, [4, 3]); }
    if (banco) { trazar(g, tr, tr.T, fX, (e) => PY(P, e.vx), 'rgba(255,181,71,0.25)', 1.3); trazar(g, tr, tr.T, fX, (e) => PY(P, e.vy), 'rgba(95,224,196,0.25)', 1.3); }
    trazar(g, tr, t, fX, (e) => PY(P, e.vx), COL.x, 2);
    trazar(g, tr, t, fX, (e) => PY(P, e.vy), COL.y, 2);
  }
  // instantes del estroboscopio (el mismo Δt de la escena)
  const n = Math.min(r.marcas.length, r.marcasVisibles);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < n; i++) {
    const k = r.marcas[i];
    const X = PX(P, k.t);
    for (const v of cual === 'pos' ? [k.x, k.y] : [k.vx, k.vy]) { g.beginPath(); g.arc(X, PY(P, v), 1.9, 0, Math.PI * 2); g.fill(); }
  }
  // cursor: el instante de la escena
  const e = estadoEn(tr, t, tmp);
  const X = Math.round(PX(P, t)) + 0.5;
  g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X, P.y0); g.lineTo(X, P.y1); g.stroke();
  const [a, b] = cual === 'pos' ? [e.x, e.y] : [e.vx, e.vy];
  g.fillStyle = COL.x; g.beginPath(); g.arc(X, PY(P, a), 3.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = COL.y; g.beginPath(); g.arc(X, PY(P, b), 3.4, 0, Math.PI * 2); g.fill();
  g.restore();
  const ini = titulo(g, izq, nombre);
  const items: [string, string, boolean?][] = cual === 'pos' ? [['x', COL.x], ['y', COL.y]] : [['vx', COL.x], ['vy', COL.y]];
  if (fant) items.push(['sin aire', 'rgba(200,215,230,0.7)', true]);
  leyenda(g, ini, 9, items, w - der - reserva);
}

// ───────────────────────────── cifras ─────────────────────────────

function Cifras({ reloj, compacto }: { reloj: RelojTiro; compacto: boolean }) {
  const refs = {
    t: useRef<HTMLSpanElement>(null), x: useRef<HTMLSpanElement>(null), y: useRef<HTMLSpanElement>(null),
    vx: useRef<HTMLSpanElement>(null), vy: useRef<HTMLSpanElement>(null), E: useRef<HTMLSpanElement>(null),
    R: useRef<HTMLSpanElement>(null), H: useRef<HTMLSpanElement>(null), T: useRef<HTMLSpanElement>(null),
  };
  useEffect(() => {
    let t0 = 0, pendiente = 0;
    const f = (forzar = false) => {
      const ahora = performance.now();
      if (!forzar && ahora - t0 < 100) {
        // el último aviso (aterrizaje, veredicto) no se pierde: se repinta al vencer el plazo
        if (!pendiente) pendiente = window.setTimeout(() => { pendiente = 0; f(true); }, 100 - (ahora - t0));
        return;
      }
      t0 = ahora;
      const l = reloj.lectura();
      const set = (r: React.RefObject<HTMLElement | null>, s: string) => { if (r.current && r.current.textContent !== s) r.current.textContent = s; };
      if (!l) { for (const r of Object.values(refs)) set(r, '—'); return; }
      const { cayo } = situacion(reloj);
      set(refs.t, cifra(l.t, 2));
      set(refs.x, cifra(l.x, 1));
      set(refs.y, cifra(l.y, 1));
      set(refs.vx, cifra(l.vx, 1));
      set(refs.vy, cifra(l.vy, 1, true));
      set(refs.E, l.E0 > 0 ? cifra((100 * l.E) / l.E0, 1) : '—');
      // en el reto, el resultado del disparo sólo cuando ya cayó
      const ver = reloj.modo === 'banco' || cayo;
      set(refs.R, ver ? cifra(l.R, l.R >= 100 ? 0 : 1) : '—');
      set(refs.H, ver ? cifra(l.H, l.H >= 100 ? 0 : 1) : '—');
      set(refs.T, ver ? cifra(l.T, 2) : '—');
    };
    f(true);
    const fuera = reloj.suscribir(() => f());
    return () => { fuera(); window.clearTimeout(pendiente); };
  }, [reloj]); // eslint-disable-line react-hooks/exhaustive-deps

  const et = 'text-[10.5px] font-semibold text-slate-400';
  const val = 'font-mono text-[12.5px] font-semibold tabular-nums text-white';
  const uni = 'ml-0.5 text-[10px] font-normal text-slate-400';
  if (compacto) {
    return (
      <div className="grid shrink-0 grid-cols-5 gap-x-2 px-0.5" data-cifras-tiro="">
        <span className={et}>t <span ref={refs.t} className={val} /><span className={uni}>s</span></span>
        <span className={et} style={{ color: COL.x }}>x <span ref={refs.x} className={val} /></span>
        <span className={et} style={{ color: COL.y }}>y <span ref={refs.y} className={val} /></span>
        <span className={et} style={{ color: COL.x }}>vx <span ref={refs.vx} className={val} /></span>
        <span className={et} style={{ color: COL.y }}>vy <span ref={refs.vy} className={val} /></span>
        <span className="hidden"><span ref={refs.E} /></span>
        <span className={`${et} col-span-5`}>R <span ref={refs.R} className={val} /><span className={uni}>m</span> · H <span ref={refs.H} className={val} /><span className={uni}>m</span> · T <span ref={refs.T} className={val} /><span className={uni}>s</span></span>
      </div>
    );
  }
  const fila = 'flex items-baseline justify-between gap-1.5';
  return (
    <div className="flex w-[152px] shrink-0 flex-col justify-between gap-0.5 py-0.5" data-cifras-tiro="">
      <div className="flex items-baseline gap-1">
        <span className={et}>t</span>
        <span ref={refs.t} className="font-mono text-[20px] font-bold leading-none tabular-nums text-white" data-reloj-tiro="" />
        <span className="text-[11px] text-slate-400">s</span>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <div className={fila}><span className={et} style={{ color: COL.x }}>x</span><span><span ref={refs.x} className={val} /><span className={uni}>m</span></span></div>
        <div className={fila}><span className={et} style={{ color: COL.x }}>vx</span><span ref={refs.vx} className={val} /></div>
        <div className={fila}><span className={et} style={{ color: COL.y }}>y</span><span><span ref={refs.y} className={val} /><span className={uni}>m</span></span></div>
        <div className={fila}><span className={et} style={{ color: COL.y }}>vy</span><span ref={refs.vy} className={val} /></div>
      </div>
      <div className={fila} title="Energía mecánica ½v² + g·y frente a la de salida: 100 % sin aire"><span className={et}>E / E₀</span><span><span ref={refs.E} className={val} /><span className={uni}>%</span></span></div>
      <div className="flex items-baseline justify-between gap-1 border-t border-white/10 pt-0.5 text-[10.5px]" title="Alcance R (m), altura máxima H (m) y tiempo de vuelo T (s) del disparo">
        <span className={et}>R <span ref={refs.R} className="font-mono text-[11.5px] font-semibold tabular-nums text-white" /></span>
        <span className={et}>H <span ref={refs.H} className="font-mono text-[11.5px] font-semibold tabular-nums text-white" /></span>
        <span className={et}>T <span ref={refs.T} className="font-mono text-[11.5px] font-semibold tabular-nums text-white" /></span>
      </div>
    </div>
  );
}

// ───────────────────────────── el dock ─────────────────────────────

type Vista = 'xy' | 'pos' | 'vel';

export function DockTiro({ reloj, complementario }: { reloj: RelojTiro; complementario: boolean }) {
  const [caja, tam] = useTamano<HTMLDivElement>();
  const estrecho = tam.w > 0 && tam.w < 620;
  const [vista, setVista] = useState<Vista>('xy');
  const [cajaA, tamA] = useTamano<HTMLDivElement>();
  const [cajaB, tamB] = useTamano<HTMLDivElement>();
  const [cajaC, tamC] = useTamano<HTMLDivElement>();
  const lA = useRef<HTMLCanvasElement>(null), lB = useRef<HTMLCanvasElement>(null), lC = useRef<HTMLCanvasElement>(null);
  const ultimo = useRef(0);
  const pendiente = useRef(0);
  const dibujar = useCallback((forzar = false) => {
    const ahora = performance.now();
    if (!forzar && ahora - ultimo.current < 30) {
      if (!pendiente.current) pendiente.current = window.setTimeout(() => { pendiente.current = 0; dibujarRef.current(true); }, 30 - (ahora - ultimo.current));
      return;
    }
    ultimo.current = ahora;
    const reserva = estrecho ? 150 : 0;
    if ((!estrecho || vista === 'xy') && lA.current && tamA.w > 0) dibujarTrayectoria(lA.current, tamA.w, tamA.h, reloj, complementario, reserva);
    if ((!estrecho || vista === 'pos') && lB.current && tamB.w > 0) dibujarTiempo(lB.current, tamB.w, tamB.h, reloj, 'pos', reserva);
    if ((!estrecho || vista === 'vel') && lC.current && tamC.w > 0) dibujarTiempo(lC.current, tamC.w, tamC.h, reloj, 'vel', reserva);
  }, [reloj, complementario, tamA.w, tamA.h, tamB.w, tamB.h, tamC.w, tamC.h, estrecho, vista]);
  const dibujarRef = useRef(dibujar);
  useEffect(() => { dibujarRef.current = dibujar; }, [dibujar]);
  useEffect(() => { dibujar(true); return reloj.suscribir(() => dibujar()); }, [reloj, dibujar]);
  useEffect(() => () => window.clearTimeout(pendiente.current), []);

  const lienzo = 'relative min-w-0 overflow-hidden rounded-md ring-1 ring-black/40';
  const pestanas: [Vista, string][] = [['xy', 'y(x)'], ['pos', 'x, y'], ['vel', 'vx, vy']];
  return (
    <div ref={caja} data-dock="tiro"
      className={`relative flex shrink-0 border-t border-white/10 bg-[#0c1524] p-2 ${estrecho ? 'h-[176px] flex-col gap-1.5' : 'h-[clamp(140px,26%,188px)] gap-2.5'}`}>
      <Cifras reloj={reloj} compacto={estrecho} />
      <div className={`relative flex min-h-0 min-w-0 flex-1 ${estrecho ? 'flex-col' : 'gap-2'}`}>
        {estrecho && (
          <div className="absolute right-1 top-1 z-10 flex gap-0.5 rounded-md bg-[#0a1220]/90 p-0.5" role="tablist" aria-label="Gráfica">
            {pestanas.map(([v, t]) => (
              <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
                className={`h-[20px] rounded px-2 text-[10.5px] font-semibold ${vista === v ? 'bg-sky-400/25 text-white' : 'text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        )}
        <div ref={cajaA} className={`${lienzo} ${estrecho ? (vista === 'xy' ? 'flex-1' : 'hidden') : 'flex-[1.25]'}`}>
          <canvas ref={lA} className="absolute inset-0 h-full w-full" role="img" aria-label="Trayectoria y frente a x a escala, con las imágenes del estroboscopio y sus proyecciones en los ejes" />
        </div>
        <div ref={cajaB} className={`${lienzo} ${estrecho ? (vista === 'pos' ? 'flex-1' : 'hidden') : 'flex-1'}`}>
          <canvas ref={lB} className="absolute inset-0 h-full w-full" role="img" aria-label="Posición horizontal x y altura y frente al tiempo" />
        </div>
        <div ref={cajaC} className={`${lienzo} ${estrecho ? (vista === 'vel' ? 'flex-1' : 'hidden') : 'flex-1'}`}>
          <canvas ref={lC} className="absolute inset-0 h-full w-full" role="img" aria-label="Componentes de la velocidad vx y vy frente al tiempo" />
        </div>
      </div>
    </div>
  );
}

/** Re-render a ≤ hz cuando el reloj avisa (trozos de React que dependen de él). */
export function useTickReloj(reloj: RelojTiro, hz = 6): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let t0 = 0;
    return reloj.suscribir(() => {
      const ahora = performance.now();
      if (ahora - t0 < 1000 / hz) return;
      t0 = ahora;
      setTick((n) => n + 1);
    });
  }, [reloj, hz]);
  return tick;
}
