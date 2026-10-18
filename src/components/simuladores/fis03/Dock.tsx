'use client';
/**
 * fis03/Dock.tsx — el dock DOM bajo la escena del péndulo. Lienzos 2D a devicePixelRatio
 * (trazos y texto nítidos) que leen EL MISMO reloj que la escena: cada cuadro integrado avisa
 * y el dock se redibuja con ese estado.
 *
 *  · Cifras: periodo de la fotopuerta, T₀ y T/T₀ (en el reto, T₀ sólo tras validar),
 *    amplitud, oscilaciones y el reparto de la energía K + U. En el reto, el cronómetro.
 *  · θ(t): el péndulo real (ecuación completa) y el lineal; con amortiguamiento, la
 *    envolvente θ₀·e^(−γt).
 *  · Fase (θ, θ̇/ω₀): con las dos coordenadas en grados el lineal es un círculo de radio θ₀;
 *    el real es un lazo más bajo (θ̇ máx = 2ω₀·sen(θ₀/2) < ω₀θ₀).
 *  · Explorar · T(θ₀): las medidas de la fotopuerta sobre la curva exacta 2K/π y la serie.
 *  · Reto · Muestras: la tabla del alumno (con borrar) y T² frente a L; las rectas
 *    T² = 4π²L/g (la del lugar y la del alumno) sólo aparecen tras validar.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square, RotateCcw, X } from 'lucide-react';
import type { RelojPendulo } from './reloj';
import { GRAD, razonPeriodo, razonSerie, periodoExacto } from './pendulo';
import { cifra, crono } from './formato';

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
const COL = {
  rejilla: 'rgba(148,180,205,0.12)', cero: 'rgba(170,196,214,0.35)', texto: 'rgba(214,228,240,0.9)', tenue: 'rgba(170,196,214,0.58)',
  real: '#ffb547', lineal: '#8fb8ff', envolvente: 'rgba(255,181,71,0.5)', serie: '#5fd3c0', punto: '#f4f7fb', lugar: '#7fe0a0', alumno: '#ffb547',
};
/** color de cada masa (1…5 kg) en T²–L */
const COL_MASA = ['#ffb547', '#7fe0c8', '#8fb8ff', '#ff8fa3', '#c9a6ff'];

function pasoBonito(rango: number, n = 4) {
  const bruto = rango / n;
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto) return k * p;
  return 10 * p;
}
/** Tope «redondo» ≥ x. */
function tope(x: number) {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  for (const k of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * p >= x - 1e-9) return k * p;
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
  g.save(); g.beginPath(); g.rect(p.x0, p.y0 - 2, p.x1 - p.x0, p.y1 - p.y0 + 4); g.clip();
}

function titulo(g: CanvasRenderingContext2D, x: number, t: string) {
  g.font = FUENTE(10.5, 700); g.fillStyle = COL.texto; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(t, x, 9);
  return x + g.measureText(t).width + 10;
}

// ───────────────────────────── θ(t) ─────────────────────────────

function dibujarTheta(cv: HTMLCanvasElement, w: number, h: number, r: RelojPendulo, fantasma: boolean, reserva: number) {
  const g = preparar(cv, w, h); if (!g) return;
  const W = r.ventana, tNow = r.e.t;
  const th0 = r.c.theta0 / GRAD;
  const yMax = tope(Math.max(2, th0 * 1.1));
  const izq = 32, der = 8, arriba = 20, abajo = 15;
  const P: Panel = { x0: izq, x1: w - der, y0: arriba, y1: h - abajo, a0: -W, a1: 0, v0: -yMax, v1: yMax };
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (const v of [-yMax, -yMax / 2, yMax / 2, yMax]) { const y = Math.round(PY(P, v)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); }
  const pt = pasoBonito(W, Math.max(2, Math.round((P.x1 - P.x0) / 70)));
  for (let t = -Math.floor(W / pt) * pt; t <= 1e-9; t += pt) { const x = Math.round(PX(P, t)) + 0.5; g.moveTo(x, P.y0); g.lineTo(x, P.y1); }
  g.stroke();
  g.strokeStyle = COL.cero; g.beginPath(); { const y = Math.round(PY(P, 0)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); } g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const v of [-yMax, 0, yMax]) g.fillText(`${cifra(v, yMax < 5 ? 1 : 0)}°`, P.x0 - 4, PY(P, v));
  g.textAlign = 'center'; g.textBaseline = 'top';
  const dec = pt < 1 ? 1 : 0;
  for (let t = -Math.floor(W / pt) * pt; t <= 1e-9; t += pt) {
    const x = PX(P, t);
    if (x < P.x0 + 10) continue;
    g.fillText(Math.abs(t) < 1e-9 ? 'ahora' : cifra(t, dec), x - (Math.abs(t) < 1e-9 ? 13 : 0), P.y1 + 2);
  }
  g.textAlign = 'left'; g.fillText('s', P.x0, P.y1 + 2);

  recortar(g, P);
  const n0 = r.hn;
  const trazo = (val: (k: number) => number, color: string, ancho: number, rayas: number[] = []) => {
    g.strokeStyle = color; g.lineWidth = ancho; g.lineJoin = 'round'; g.setLineDash(rayas); g.beginPath();
    let primero = true;
    for (let k = 0; k < n0; k++) {
      const m = r.muestra(k);
      if (m.t < tNow - W - 0.05) continue;
      const x = PX(P, m.t - tNow), y = PY(P, val(k) / GRAD);
      if (primero) { g.moveTo(x, y); primero = false; } else g.lineTo(x, y);
    }
    if (!primero) g.stroke();
    g.setLineDash([]);
  };
  // envolvente θ₀·e^(−γt) del amortiguamiento
  if (r.c.gamma > 0 && r.c.suelto) {
    g.strokeStyle = COL.envolvente; g.lineWidth = 1; g.setLineDash([2, 3]);
    for (const s of [1, -1]) {
      g.beginPath();
      let primero = true;
      for (let i = 0; i <= 80; i++) {
        const t = tNow - W + (W * i) / 80;
        if (t < r.tSuelta) continue;
        const y = PY(P, (s * r.c.theta0 * Math.exp(-r.c.gamma * (t - r.tSuelta))) / GRAD);
        const x = PX(P, t - tNow);
        if (primero) { g.moveTo(x, y); primero = false; } else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.setLineDash([]);
  }
  if (fantasma) trazo((k) => r.muestra(k).lin, COL.lineal, 1.4, [5, 3]);
  trazo((k) => r.muestra(k).th, COL.real, 2.1);
  // el estado de ESTE cuadro
  const xN = PX(P, 0);
  g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(xN - 1, PY(P, r.e.theta / GRAD), 3.3, 0, Math.PI * 2); g.fill();
  if (fantasma) { g.fillStyle = COL.lineal; g.beginPath(); g.arc(xN - 1, PY(P, r.lineal().theta / GRAD), 2.6, 0, Math.PI * 2); g.fill(); }
  g.restore();
  const ini = titulo(g, izq, 'θ(t)');
  const it: [string, string, boolean?][] = [['real', COL.real]];
  if (fantasma) it.push(['lineal (sen θ ≈ θ)', COL.lineal, true]);
  if (r.c.gamma > 0) it.push(['θ₀·e^(−γt)', COL.envolvente, true]);
  leyenda(g, ini, 9, it, w - der - reserva);
}

// ───────────────────────────── fase ─────────────────────────────

function dibujarFase(cv: HTMLCanvasElement, w: number, h: number, r: RelojPendulo, fantasma: boolean, reserva: number) {
  const g = preparar(cv, w, h); if (!g) return;
  const th0 = r.c.theta0 / GRAD;
  const R = tope(Math.max(2, th0 * 1.08));
  const arriba = 20, abajo = 14;
  const lado = Math.max(40, Math.min(h - arriba - abajo, w - 70));
  const cx = 36 + (w - 44 - lado) / 2 + lado / 2;
  const P: Panel = { x0: cx - lado / 2, x1: cx + lado / 2, y0: arriba, y1: arriba + lado, a0: -R, a1: R, v0: -R, v1: R };
  // rejilla
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (const v of [-R, -R / 2, R / 2, R]) {
    const x = Math.round(PX(P, v)) + 0.5, y = Math.round(PY(P, v)) + 0.5;
    g.moveTo(x, P.y0); g.lineTo(x, P.y1); g.moveTo(P.x0, y); g.lineTo(P.x1, y);
  }
  g.stroke();
  g.strokeStyle = COL.cero; g.beginPath();
  { const x = Math.round(PX(P, 0)) + 0.5, y = Math.round(PY(P, 0)) + 0.5; g.moveTo(x, P.y0); g.lineTo(x, P.y1); g.moveTo(P.x0, y); g.lineTo(P.x1, y); }
  g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textBaseline = 'middle';
  g.textAlign = 'right'; g.fillText(`${cifra(R, 0)}°`, P.x0 - 4, PY(P, R)); g.fillText(`−${cifra(R, 0)}°`, P.x0 - 4, PY(P, -R));
  g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(`−${cifra(R, 0)}°`, P.x0, P.y1 + 2); g.fillText(`${cifra(R, 0)}°`, P.x1, P.y1 + 2);
  g.fillStyle = COL.texto; g.font = FUENTE(10, 600);
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('θ', P.x1 + 5, PY(P, 0));
  g.textAlign = 'right'; g.fillText('θ̇/ω₀', PX(P, 0) - 5, P.y0 + 5);

  recortar(g, { ...P, x0: P.x0 - 1, x1: P.x1 + 1 });
  const w0 = Math.sqrt(r.c.g / r.c.L);
  const T = periodoExacto(r.c.L, r.c.g, Math.min(r.amplitud, 179 * GRAD));
  const desde = Math.max(r.tSuelta, r.e.t - 1.08 * T);
  const n0 = r.hn;
  const trazo = (pick: (m: ReturnType<RelojPendulo['muestra']>) => [number, number], color: string, ancho: number, rayas: number[] = []) => {
    g.strokeStyle = color; g.lineWidth = ancho; g.lineJoin = 'round'; g.setLineDash(rayas); g.beginPath();
    let primero = true;
    for (let k = 0; k < n0; k++) {
      const m = r.muestra(k);
      if (m.t < desde) continue;
      const [a, b] = pick(m);
      const x = PX(P, a / GRAD), y = PY(P, b / w0 / GRAD);
      if (primero) { g.moveTo(x, y); primero = false; } else g.lineTo(x, y);
    }
    if (!primero) g.stroke();
    g.setLineDash([]);
  };
  if (fantasma) trazo((m) => [m.lin, m.wl], COL.lineal, 1.4, [5, 3]);
  trazo((m) => [m.th, m.w], COL.real, 2.1);
  if (fantasma) { const l = r.lineal(); g.fillStyle = COL.lineal; g.beginPath(); g.arc(PX(P, l.theta / GRAD), PY(P, l.omega / w0 / GRAD), 2.6, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(PX(P, r.e.theta / GRAD), PY(P, r.e.omega / w0 / GRAD), 3.3, 0, Math.PI * 2); g.fill();
  g.restore();
  const ini = titulo(g, 8, 'Fase');
  const it: [string, string, boolean?][] = [['real', COL.real]];
  if (fantasma) it.push(['lineal', COL.lineal, true]);
  leyenda(g, ini, 9, it, w - 8 - reserva);
}

// ───────────────────────────── T(θ₀) ─────────────────────────────

function dibujarIsocronismo(cv: HTMLCanvasElement, w: number, h: number, r: RelojPendulo, reserva: number) {
  const g = preparar(cv, w, h); if (!g) return;
  const izq = 36, der = 10, arriba = 20, abajo = 15;
  const P: Panel = { x0: izq, x1: w - der, y0: arriba, y1: h - abajo, a0: 0, a1: 90, v0: 1, v1: 1.2 };
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (const a of [30, 60]) { const x = Math.round(PX(P, a)) + 0.5; g.moveTo(x, P.y0); g.lineTo(x, P.y1); }
  for (const v of [1.05, 1.1, 1.15, 1.2]) { const y = Math.round(PY(P, v)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); }
  g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const v of [1, 1.1, 1.2]) g.fillText(cifra(v, 2), P.x0 - 4, PY(P, v));
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (const a of [0, 30, 60, 90]) g.fillText(`${a}°`, PX(P, a) + (a === 0 ? 5 : a === 90 ? -6 : 0), P.y1 + 2);

  recortar(g, P);
  // lineal: T = T₀ siempre
  g.strokeStyle = COL.lineal; g.lineWidth = 1.3; g.setLineDash([2, 3]);
  g.beginPath(); g.moveTo(P.x0, PY(P, 1)); g.lineTo(P.x1, PY(P, 1)); g.stroke();
  // serie de dos términos
  g.strokeStyle = COL.serie; g.lineWidth = 1.4; g.setLineDash([5, 3]); g.beginPath();
  for (let i = 0; i <= 90; i++) { const x = PX(P, i), y = PY(P, razonSerie(i * GRAD)); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.stroke(); g.setLineDash([]);
  // exacta 2K(k)/π
  g.strokeStyle = COL.real; g.lineWidth = 2.1; g.beginPath();
  for (let i = 0; i <= 180; i++) { const a = i / 2, x = PX(P, a), y = PY(P, razonPeriodo(a * GRAD)); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.stroke();
  // medidas de la fotopuerta
  const ms = r.medidas;
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i];
    const x = PX(P, m.amp / GRAD), y = PY(P, m.razon);
    const ultima = i === ms.length - 1;
    g.fillStyle = ultima ? '#ffffff' : 'rgba(244,247,251,0.7)';
    g.beginPath(); g.arc(x, y, ultima ? 3.4 : 2.3, 0, Math.PI * 2); g.fill();
    if (ultima) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.stroke(); }
  }
  g.restore();
  const ini = titulo(g, izq, 'T/T₀');
  leyenda(g, ini, 9, [['2K/π', COL.real], ['serie', COL.serie, true], ['lineal', COL.lineal, true], ['medida', COL.punto]], w - der - reserva);
}

// ───────────────────────────── muestras (reto) ─────────────────────────────

export interface MuestraDock { L: number; m: number; n: number; t: number }

function dibujarT2L(cv: HTMLCanvasElement, w: number, h: number, ms: MuestraDock[], validado: boolean, gReal: number | null, gAlumno: number | null) {
  const g = preparar(cv, w, h); if (!g) return;
  const izq = 34, der = 10, arriba = 20, abajo = 15;
  let t2max = 0;
  for (const s of ms) t2max = Math.max(t2max, (s.t / s.n) ** 2);
  if (validado && gReal) t2max = Math.max(t2max, (4 * Math.PI ** 2 * 3.2) / gReal);
  const yTop = tope(Math.max(1, t2max * 1.12));
  const P: Panel = { x0: izq, x1: w - der, y0: arriba, y1: h - abajo, a0: 0, a1: 3.2, v0: 0, v1: yTop };
  const py = pasoBonito(yTop, 3);
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (const L of [1, 2, 3]) { const x = Math.round(PX(P, L)) + 0.5; g.moveTo(x, P.y0); g.lineTo(x, P.y1); }
  for (let v = py; v <= yTop + 1e-9; v += py) { const y = Math.round(PY(P, v)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); }
  g.stroke();
  g.strokeStyle = COL.cero; g.beginPath(); g.moveTo(P.x0 + 0.5, P.y0); g.lineTo(P.x0 + 0.5, P.y1); g.lineTo(P.x1, P.y1 - 0.5); g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let v = 0; v <= yTop + 1e-9; v += py) g.fillText(cifra(v, py < 1 ? 1 : 0), P.x0 - 4, PY(P, v));
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (const L of [0, 1, 2, 3]) g.fillText(cifra(L, 0), PX(P, L), P.y1 + 2);
  // el nombre del eje, dentro y abajo a la derecha: con T² ∝ L esa esquina siempre está vacía
  g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('L (m)', P.x1 - 3, P.y1 - 3);
  recortar(g, P);
  // las rectas por el origen, sólo tras validar
  if (validado) {
    const recta = (gg: number, color: string, rayas: number[]) => {
      g.strokeStyle = color; g.lineWidth = 1.6; g.setLineDash(rayas);
      g.beginPath(); g.moveTo(PX(P, 0), PY(P, 0)); g.lineTo(PX(P, 3.2), PY(P, (4 * Math.PI ** 2 * 3.2) / gg)); g.stroke(); g.setLineDash([]);
    };
    if (gReal) recta(gReal, COL.lugar, []);
    if (gAlumno && gAlumno > 0) recta(gAlumno, COL.alumno, [5, 3]);
  }
  for (const s of ms) {
    const T = s.t / s.n;
    g.fillStyle = COL_MASA[Math.max(0, Math.min(4, Math.round(s.m) - 1))];
    g.beginPath(); g.arc(PX(P, s.L), PY(P, T * T), 3.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(10,18,32,0.9)'; g.lineWidth = 1; g.stroke();
  }
  g.restore();
  const ini = titulo(g, izq, 'T² (s²)');
  const it: [string, string, boolean?][] = validado ? [['g del lugar', COL.lugar], ['tu g', COL.alumno, true]] : [];
  leyenda(g, ini, 9, it, w - der);
}

function Muestras({ muestras, onBorrar, validado, gReal, gAlumno }: {
  muestras: MuestraDock[]; onBorrar?: (i: number) => void; validado: boolean; gReal: number | null; gAlumno: number | null;
}) {
  const [caja, tam] = useTamano<HTMLDivElement>();
  const lienzo = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (lienzo.current && tam.w > 0) dibujarT2L(lienzo.current, tam.w, tam.h, muestras, validado, gReal, gAlumno);
  }, [muestras, validado, gReal, gAlumno, tam.w, tam.h]);
  const Ls = new Set(muestras.map((s) => s.L)).size;
  const masaIndep = muestras.some((a) => muestras.some((b) => a.L === b.L && a.m !== b.m));
  return (
    <div className="flex h-full min-h-0 gap-2" data-muestras-f3="">
      <div className="flex min-h-0 w-[46%] min-w-[204px] max-w-[310px] flex-col rounded-md bg-[#0a1220] px-2 py-1 ring-1 ring-black/40">
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold">
          <span className={Ls >= 3 ? 'text-emerald-300' : 'text-slate-400'}>{Math.min(Ls, 3)}/3 longitudes</span>
          <span className={masaIndep ? 'text-emerald-300' : 'text-slate-400'}>· 2 masas, misma L {masaIndep ? '✓' : ''}</span>
        </div>
        {muestras.length === 0 ? (
          <p className="mt-1 text-[10.5px] text-slate-400">Cronometra n oscilaciones y registra la muestra.</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            <table className="w-full font-mono text-[10.5px] tabular-nums">
              <thead><tr className="text-slate-400"><th className="text-left font-semibold">L m</th><th className="text-left font-semibold">kg</th><th className="text-left font-semibold">n</th><th className="text-left font-semibold">t s</th><th className="text-left font-semibold">T s</th><th /></tr></thead>
              <tbody>
                {muestras.map((s, i) => (
                  <tr key={i} className="border-t border-white/5 text-slate-100">
                    <td>{cifra(s.L, 1)}</td>
                    <td><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: COL_MASA[Math.max(0, Math.min(4, Math.round(s.m) - 1))] }} />{cifra(s.m, 0)}</td>
                    <td>{s.n}</td><td>{cifra(s.t, 2)}</td><td>{cifra(s.t / s.n, 3)}</td>
                    <td className="text-right"><button type="button" aria-label={`Borrar la muestra ${i + 1}`} onClick={() => onBorrar?.(i)} className="text-slate-500 hover:text-rose-400"><X size={11} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div ref={caja} className="relative min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-black/40">
        <canvas ref={lienzo} className="absolute inset-0 h-full w-full" role="img" aria-label="Cuadrado del periodo frente a la longitud, con tus muestras" />
      </div>
    </div>
  );
}

// ───────────────────────────── cifras ─────────────────────────────

function Cifras({ reloj, modo, validado, compacto, onCrono }: { reloj: RelojPendulo; modo: 'explorar' | 'reto'; validado: boolean; compacto: boolean; onCrono?: () => void }) {
  const refs = {
    T: useRef<HTMLSpanElement>(null), T0: useRef<HTMLSpanElement>(null), razon: useRef<HTMLSpanElement>(null),
    amp: useRef<HTMLSpanElement>(null), n: useRef<HTMLSpanElement>(null), crono: useRef<HTMLSpanElement>(null),
    barK: useRef<HTMLDivElement>(null), barU: useRef<HTMLDivElement>(null),
  };
  const [corriendo, setCorriendo] = useState(reloj.crono.corriendo);
  const reto = modo === 'reto';
  useEffect(() => {
    let t0 = 0;
    const f = (forzar = false) => {
      const ahora = performance.now();
      if (!forzar && ahora - t0 < (reloj.crono.corriendo ? 45 : 110)) return;
      t0 = ahora;
      const l = reloj.lectura();
      const set = (r: React.RefObject<HTMLElement | null>, s: string) => { if (r.current && r.current.textContent !== s) r.current.textContent = s; };
      set(refs.T, Number.isFinite(l.T) ? cifra(l.T, 4) : '—');
      set(refs.T0, !reto || validado ? cifra(l.T0, 4) : 'tras validar');
      set(refs.razon, Number.isFinite(l.T) ? cifra(l.T / l.T0, 4) : '—');
      set(refs.amp, cifra(l.amp / GRAD, 1));
      set(refs.n, String(l.n));
      set(refs.crono, crono(reloj.cronoLeer()));
      const E = Math.max(1e-12, l.E0);
      if (refs.barK.current) refs.barK.current.style.width = `${Math.min(100, (l.K / E) * 100).toFixed(2)}%`;
      if (refs.barU.current) refs.barU.current.style.width = `${Math.min(100, (l.U / E) * 100).toFixed(2)}%`;
      setCorriendo(reloj.crono.corriendo);
    };
    f(true);
    return reloj.suscribir(() => f());
  }, [reloj, reto, validado]); // eslint-disable-line react-hooks/exhaustive-deps

  const et = 'text-[10.5px] font-semibold text-slate-400';
  const val = 'font-mono text-[12.5px] font-semibold tabular-nums text-white';
  const uni = 'ml-0.5 text-[10.5px] font-normal text-slate-400';
  const fila = 'flex items-baseline justify-between gap-2';
  const botonesCrono = (
    <span className="flex items-center gap-1">
      <button type="button" onClick={() => { reloj.cronoAlternar(); onCrono?.(); }} aria-label={corriendo ? 'Detener el cronómetro' : 'Iniciar el cronómetro'} title={corriendo ? 'Detener' : 'Iniciar'}
        className={`flex h-6 w-7 items-center justify-center rounded-md text-white ${corriendo ? 'bg-[#FB8500] hover:bg-[#e07700]' : 'bg-[#219EBC] hover:bg-[#1b87a1]'}`} data-crono-f3="">
        {corriendo ? <Square size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
      </button>
      <button type="button" onClick={() => { reloj.cronoReiniciar(); onCrono?.(); }} aria-label="Reiniciar el cronómetro" title="Reiniciar"
        className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 text-slate-300 hover:text-white">
        <RotateCcw size={11} />
      </button>
    </span>
  );
  // (las referencias que una disposición no muestra quedan nulas: `set` las salta)
  if (compacto) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-2 px-0.5" data-cifras-f3="">
        {reto && (
          <span className="flex items-center gap-1.5">
            <span ref={refs.crono} className="font-mono text-[15px] font-bold tabular-nums text-[#7fe0c8]" data-cronometro="" title="Cronómetro" />
            {botonesCrono}
          </span>
        )}
        <span className={et} title="Periodo que mide la fotopuerta">T <span ref={refs.T} className="font-mono text-[14px] font-bold tabular-nums text-[#ffd59a]" data-fotopuerta="" /><span className={uni}>s</span></span>
        {!reto && <span className={et}>T₀ <span ref={refs.T0} className={val} /><span className={uni}>s</span></span>}
        {!reto && <span className={et}>T/T₀ <span ref={refs.razon} className={val} /></span>}
        <span className={et}>n <span ref={refs.n} className={val} /></span>
      </div>
    );
  }
  return (
    <div className="flex w-[156px] shrink-0 flex-col justify-between gap-0.5 py-0.5" data-cifras-f3="">
      {reto ? (
        <div>
          <div className={et}>Cronómetro</div>
          <div className="flex items-center justify-between gap-1">
            <span ref={refs.crono} className="font-mono text-[19px] font-bold leading-none tabular-nums text-[#7fe0c8]" data-cronometro="" />
            {botonesCrono}
          </div>
        </div>
      ) : null}
      <div>
        <div className={et} title="Tiempo entre dos pasos por el haz en el mismo sentido">Fotopuerta · T</div>
        <div className="flex items-baseline gap-1">
          <span ref={refs.T} className={`font-mono font-bold leading-none tabular-nums text-[#ffd59a] ${reto ? 'text-[15px]' : 'text-[20px]'}`} data-fotopuerta="" />
          <span className="text-[11px] text-slate-400">s</span>
        </div>
      </div>
      <div className={fila} title="T₀ = 2π√(L/g), el de ángulo pequeño"><span className={et}>T₀</span><span><span ref={refs.T0} className={reto && !validado ? 'text-[10.5px] italic text-slate-400' : val} />{(!reto || validado) && <span className={uni}>s</span>}</span></div>
      {!reto && <div className={fila}><span className={et}>T/T₀</span><span ref={refs.razon} className={val} /></div>}
      <div className={fila}><span className={et}>Amplitud</span><span><span ref={refs.amp} className={val} /><span className={uni}>°</span></span></div>
      <div className={fila}><span className={et}>Oscilaciones</span><span ref={refs.n} className={val} /></div>
      <div title="Energía de la esfera: cinética K (ámbar) y potencial U (azul), frente a la de la suelta">
        <div className="flex h-[6px] w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div ref={refs.barK} className="h-full bg-[#ffb547]" />
          <div ref={refs.barU} className="h-full bg-[#8fb8ff]" />
        </div>
        <div className="mt-0.5 flex justify-between text-[9.5px] text-slate-400"><span><span className="text-[#ffcf8a]">K</span> + <span className="text-[#a9c8ff]">U</span></span><span>E/E₀</span></div>
      </div>
    </div>
  );
}

// ───────────────────────────── el dock ─────────────────────────────

type Vista = 'theta' | 'fase' | 'iso' | 'muestras';

/**
 * Disposición: en ancho, θ(t) a la izquierda y Fase | T(θ₀) a la derecha (explorar); en el
 * reto, «Gráficas» (θ(t) + fase) o «Muestras» a todo lo ancho (la tabla y T²–L necesitan
 * sitio). En estrecho (< 600 px), una sola gráfica con pestañas. Nunca hay barra de scroll
 * salvo en la tabla del alumno cuando pasa de siete muestras.
 */
export function DockPendulo({ reloj, modo, fantasma, validado, gReal = null, gAlumno = null, muestras = [], onBorrar, onCrono }: {
  reloj: RelojPendulo; modo: 'explorar' | 'reto'; fantasma: boolean; validado: boolean;
  gReal?: number | null; gAlumno?: number | null; muestras?: MuestraDock[]; onBorrar?: (i: number) => void; onCrono?: () => void;
}) {
  const [caja, tam] = useTamano<HTMLDivElement>();
  const estrecho = tam.w > 0 && tam.w < 600;
  const reto = modo === 'reto';
  const extra: Vista = reto ? 'muestras' : 'iso';
  const [vistaB, setVistaB] = useState<'fase' | 'iso'>('fase');
  const [vistaR, setVistaR] = useState<'graf' | 'muestras'>('graf');
  const [vistaE, setVistaE] = useState<Vista>('theta');
  // al registrar una muestra, se enseña la tabla
  const nPrev = useRef(muestras.length);
  useEffect(() => {
    if (muestras.length > nPrev.current) { setVistaR('muestras'); setVistaE('muestras'); }
    nPrev.current = muestras.length;
  }, [muestras.length]);
  useEffect(() => { if (!reto && vistaE === 'muestras') setVistaE('iso'); if (reto && vistaE === 'iso') setVistaE('muestras'); }, [reto, vistaE]);

  const [cajaA, tamA] = useTamano<HTMLDivElement>();
  const [cajaB, tamB] = useTamano<HTMLDivElement>();
  const lA = useRef<HTMLCanvasElement>(null);
  const lB = useRef<HTMLCanvasElement>(null);
  const fan = useRef(fantasma); fan.current = fantasma;
  const ultimo = useRef(0);
  const verMuestras = reto && (estrecho ? vistaE === 'muestras' : vistaR === 'muestras');
  // qué dibuja cada lienzo: en ancho A es θ(t) y B la fase (o T(θ₀)); en estrecho, A es la elegida
  const vistaA: Vista = estrecho ? vistaE : 'theta';
  const vistaLB: Vista = reto ? 'fase' : vistaB;
  const dibujar = useCallback((forzar = false) => {
    const ahora = performance.now();
    if (!forzar && ahora - ultimo.current < 33) return;
    ultimo.current = ahora;
    const pinta = (cv: HTMLCanvasElement | null, t: { w: number; h: number }, v: Vista, res: number) => {
      if (!cv || t.w <= 0 || t.h <= 0) return;
      if (v === 'theta') dibujarTheta(cv, t.w, t.h, reloj, fan.current, res);
      else if (v === 'fase') dibujarFase(cv, t.w, t.h, reloj, fan.current, res);
      else if (v === 'iso') dibujarIsocronismo(cv, t.w, t.h, reloj, res);
    };
    if (verMuestras) return;
    pinta(lA.current, tamA, vistaA, estrecho ? 168 : 0);
    if (!estrecho) pinta(lB.current, tamB, vistaLB, reto ? 150 : 96);
  }, [reloj, tamA, tamB, estrecho, vistaA, vistaLB, verMuestras, reto]);
  useEffect(() => { dibujar(true); return reloj.suscribir(() => dibujar()); }, [reloj, dibujar]);
  useEffect(() => { dibujar(true); }, [fantasma, modo, dibujar]);

  const lienzo = 'relative min-w-0 overflow-hidden rounded-md ring-1 ring-black/40';
  const pestanas = (opciones: [string, string][], activa: string, set: (v: string) => void) => (
    <div className="absolute right-1 top-1 z-10 flex gap-0.5 rounded-md bg-[#0a1220]/90 p-0.5" role="tablist" aria-label="Gráfica">
      {opciones.map(([v, t]) => (
        <button key={v} type="button" role="tab" aria-selected={activa === v} onClick={() => set(v)}
          className={`h-[20px] rounded px-2 text-[10.5px] font-semibold ${activa === v ? 'bg-sky-400/25 text-white' : 'text-slate-400 hover:text-white'}`}>
          {t}
        </button>
      ))}
    </div>
  );
  const muestrasPanel = (
    <div className={`min-h-0 flex-1 ${estrecho ? 'pt-6' : ''}`}>
      <Muestras muestras={muestras} onBorrar={onBorrar} validado={validado} gReal={gReal} gAlumno={gAlumno} />
    </div>
  );

  return (
    <div ref={caja} data-dock="pendulo"
      className={`relative flex shrink-0 border-t border-white/10 bg-[#0c1524] p-2 ${estrecho ? 'h-[178px] flex-col gap-1.5' : 'h-[clamp(150px,27%,196px)] gap-2.5'}`}>
      <Cifras reloj={reloj} modo={modo} validado={validado} compacto={estrecho} onCrono={onCrono} />
      {/* en el reto ancho, las pestañas Gráficas | Muestras tienen su franja: no tapan los ejes */}
      <div className={`relative flex min-h-0 min-w-0 flex-1 ${estrecho ? 'flex-col' : reto ? 'gap-2 pt-[28px]' : 'gap-2'}`}>
        {estrecho && pestanas([['theta', 'θ(t)'], ['fase', 'Fase'], [extra, reto ? 'Muestras' : 'T(θ₀)']], vistaE, (v) => setVistaE(v as Vista))}
        {!estrecho && reto && pestanas([['graf', 'Gráficas'], ['muestras', `Muestras${muestras.length ? ` · ${muestras.length}` : ''}`]], vistaR, (v) => setVistaR(v as 'graf' | 'muestras'))}
        <div ref={cajaA} className={`${lienzo} ${verMuestras ? 'hidden' : estrecho ? 'flex-1' : 'flex-[1.15]'}`}>
          <canvas ref={lA} className="absolute inset-0 h-full w-full" role="img" aria-label="Gráfica del péndulo" />
        </div>
        {!estrecho && (
          <div className={`relative min-h-0 min-w-0 flex-1 flex-col ${verMuestras ? 'hidden' : 'flex'}`}>
            {!reto && pestanas([['fase', 'Fase'], ['iso', 'T(θ₀)']], vistaB, (v) => setVistaB(v as 'fase' | 'iso'))}
            <div ref={cajaB} className={`${lienzo} flex-1`}>
              <canvas ref={lB} className="absolute inset-0 h-full w-full" role="img" aria-label={vistaLB === 'fase' ? 'Diagrama de fase del péndulo' : 'Periodo frente a la amplitud'} />
            </div>
          </div>
        )}
        {verMuestras && muestrasPanel}
      </div>
    </div>
  );
}

/** Re-render a ≤ hz cuando el reloj integra (para trozos de React que dependen de él). */
export function useTickReloj(reloj: RelojPendulo, hz = 8): number {
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
