'use client';
/**
 * bio02/Dock.tsx — el dock de instrumentos BAJO la escena, en DOM nítido (lienzos a
 * devicePixelRatio, tipografía del lab). Lee EL MISMO reloj que la escena: cada lienzo se
 * redibuja cuando el reloj integra un cuadro nuevo.
 *
 *  · EXPLORACIÓN: los cuatro gradientes frente al tiempo desde la transferencia (agua,
 *    glucosa y O₂ se disipan, cada uno a su ritmo; el de Na⁺ lo sostiene la bomba); el
 *    volumen frente a la tonicidad (Boyle–van 't Hoff, con el punto de la célula subiendo
 *    hacia la curva) y las curvas de saturación de GLUT1 y de la bomba.
 *  · RETO: V(t) de la muestra, las lecturas del alumno (V/V₀ frente a la osmolaridad del
 *    medio) y su tabla. La curva de la muestra y su osmolaridad sólo se dibujan tras validar.
 *
 * Ancho < 760 px (p. ej. 1366×768 con el panel «Modelo» abierto, o un móvil): una gráfica
 * cada vez, con pestañas. Nunca hay scroll interno.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  GLUT1, kcatGlut1, BOMBA, vmaxBomba, mm, ERITROCITO, N_IMPERMEANTE, presionOsmotica, UMBRAL_LISIS_B2, VMAX_VEGETAL_B2, RANGO,
} from './transporte';
import type { RelojTransporte, RelojReto, VistaB2, PuntoGradiente } from './reloj';

// ───────────────────────────── formato ─────────────────────────────

const MENOS = '−';
/** Cifra con coma decimal, signo tipográfico y espacio fino (U+202F) en los millares (≥ 10 000). */
export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const [ent0, dec] = abs.split('.');
  const ent = ent0.length > 4 ? ent0.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ent0;
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
const COL = { fondo: '#0a131c', rejilla: 'rgba(148,180,205,0.12)', eje: 'rgba(170,196,214,0.55)', texto: 'rgba(222,233,242,0.92)', tenue: 'rgba(170,196,214,0.62)' };
export const COLOR = { agua: '#7cc8f0', glucosa: '#f3d38b', o2: '#ff6b5e', na: '#f4a340', k: '#a98af2', glut: '#e8a843', bomba: '#a48ce4', v: '#ffd9a0', lisis: '#ff6b7a' };

function pasoBonito(rango: number, n = 4) {
  const bruto = rango / Math.max(1, n);
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto) return k * p;
  return 10 * p;
}
function textoHalo(g: CanvasRenderingContext2D, txt: string, x: number, y: number) {
  const f = g.fillStyle;
  g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = 'rgba(10,19,28,0.92)';
  g.strokeText(txt, x, y);
  g.fillStyle = f; g.fillText(txt, x, y);
}

interface Marco { X: (v: number) => number; Y: (v: number) => number; x0: number; x1: number; y0: number; y1: number }
/** Ejes con rejilla y cifras (con coma). Rótulos de eje cortos, dentro del área. */
function ejes(g: CanvasRenderingContext2D, w: number, h: number, o: {
  xa: number; xb: number; ya: number; yb: number; xFmt?: (v: number) => string; yFmt?: (v: number) => string;
  xRot: string; yRot: string; izq?: number; xMarcas?: number[]; yMarcas?: number[];
}): Marco {
  const fam = familia();
  const izq = o.izq ?? 32, der = 8, arriba = 6, abajo = 15;
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
  g.font = `500 9.5px ${fam}`; g.fillStyle = COL.tenue;
  g.textAlign = 'center'; g.textBaseline = 'top';
  const xf = o.xFmt ?? ((v: number) => cifra(v, 0));
  g.font = `600 9.5px ${fam}`;
  const anchoRot = g.measureText(o.xRot).width + 14;
  g.font = `500 9.5px ${fam}`;
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
function punto(g: CanvasRenderingContext2D, x: number, y: number, color: string, r = 4, hueco = false) {
  g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  if (hueco) { g.strokeStyle = color; g.stroke(); } else { g.fillStyle = color; g.strokeStyle = '#08111a'; g.fill(); g.stroke(); }
}

/** Lienzo que se redibuja cuando cambia la versión del reloj (o sus deps). */
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
  useEffect(() => {
    const c = lienzo.current; if (!c || tam.w < 20 || tam.h < 20) return;
    let id = 0, ultima = -1, ultimoR: ConVersion | null = null, forzar = true;
    const bucle = () => {
      id = requestAnimationFrame(bucle);
      const r = reloj.current;
      if (!forzar && r.version === ultima && r === ultimoR) return;
      forzar = false; ultima = r.version; ultimoR = r;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloj, tam.w, tam.h, ...deps]);
  return (
    <div ref={caja} className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-black/40">
      <canvas ref={lienzo} className="absolute inset-0 h-full w-full" role="img" aria-label={etiqueta} />
    </div>
  );
}

function Panel({ titulo, dato, children, extra, cabecera }: { titulo: string; dato?: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode; cabecera?: React.ReactNode }) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
      <header className="flex h-[20px] shrink-0 items-center justify-between gap-2">
        {cabecera ?? <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">{titulo}</span>}
        <span className="flex shrink-0 items-center gap-1.5">{extra}{dato && <span className="whitespace-nowrap font-mono text-[10.5px] tabular-nums text-slate-200">{dato}</span>}</span>
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

// ───────────────────────────── exploración ─────────────────────────────

const FILAS: { k: keyof Omit<PuntoGradiente, 't' | 'v'>; nombre: string; unidad: string; color: string; d: number }[] = [
  { k: 'agua', nombre: 'ΔOsm', unidad: 'mOsm/L', color: COLOR.agua, d: 1 },
  { k: 'glucosa', nombre: 'Δglucosa', unidad: 'mM', color: COLOR.glucosa, d: 2 },
  { k: 'o2', nombre: 'ΔpO₂', unidad: 'mmHg', color: COLOR.o2, d: 1 },
  { k: 'na', nombre: 'ΔNa⁺', unidad: 'mM', color: COLOR.na, d: 0 },
];

/** Formato de un tiempo real (s) para el eje: ms por debajo de 1,5 s. */
function fmtT(tMax: number) { return tMax < 1.5 ? (v: number) => cifra(v * 1000, 0) : (v: number) => cifra(v, tMax < 15 ? 1 : 0); }

function dibujarGradientes(g: CanvasRenderingContext2D, w: number, h: number, r: RelojTransporte) {
  const fam = familia();
  const hist = r.historia;
  const tNow = r.estado.t;
  const tMax = Math.max(tNow * 1.04, 0.02);
  const etiq = Math.min(92, Math.max(64, w * 0.2)), valor = Math.min(98, Math.max(74, w * 0.22));
  const x0 = etiq, x1 = w - valor, arriba = 2, abajo = 14;
  const filaH = (h - arriba - abajo) / FILAS.length;
  const X = (t: number) => x0 + (t / tMax) * (x1 - x0);
  // eje de tiempo común
  const ms = tMax < 1.5;
  const paso = pasoBonito(ms ? tMax * 1000 : tMax, Math.max(2, Math.round((x1 - x0) / 70))) / (ms ? 1000 : 1);
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (let t = 0; t <= tMax + 1e-12; t += paso) { const x = Math.round(X(t)) + 0.5; g.moveTo(x, arriba); g.lineTo(x, h - abajo); }
  g.stroke();
  g.font = `500 9.5px ${fam}`; g.fillStyle = COL.tenue; g.textAlign = 'center'; g.textBaseline = 'top';
  const f = fmtT(tMax);
  for (let t = 0; t <= tMax + 1e-12; t += paso) { const x = X(t); if (x < x1 - 52) g.fillText(f(t), x, h - abajo + 2); }
  g.textAlign = 'right'; g.fillStyle = COL.texto; g.font = `600 9.5px ${fam}`;
  g.fillText(ms ? 'ms reales' : 's reales', x1, h - abajo + 2);
  FILAS.forEach((fila, i) => {
    const ya = arriba + i * filaH, yb = ya + filaH;
    let vMin = 0, vMax = 0;
    for (const p of hist) { const v = p[fila.k]; if (v < vMin) vMin = v; if (v > vMax) vMax = v; }
    if (vMax - vMin < 1e-6) { vMax += 1; }
    const Y = (v: number) => yb - 3 - ((v - vMin) / (vMax - vMin)) * (filaH - 7);
    // cero
    if (vMin < 0 || vMax > 0) { g.strokeStyle = 'rgba(170,196,214,0.22)'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x0, Math.round(Y(0)) + 0.5); g.lineTo(x1, Math.round(Y(0)) + 0.5); g.stroke(); g.setLineDash([]); }
    const pts: [number, number][] = hist.map((p) => [X(p.t), Y(p[fila.k])]);
    // relleno suave bajo la curva
    if (pts.length > 1) {
      g.beginPath(); g.moveTo(pts[0][0], Y(0)); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(pts[pts.length - 1][0], Y(0)); g.closePath();
      g.fillStyle = `${fila.color}22`; g.fill();
    }
    linea(g, pts, fila.color, 1.7);
    const u = hist[hist.length - 1];
    if (u) punto(g, X(u.t), Y(u[fila.k]), fila.color, 2.6);
    g.font = `700 10.5px ${fam}`; g.fillStyle = fila.color; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(fila.nombre, 4, (ya + yb) / 2);
    g.font = `500 10.5px ${fam}`; g.fillStyle = COL.texto; g.textAlign = 'right';
    g.fillText(`${u ? cifra(u[fila.k], fila.d) : '—'} ${fila.unidad}`, w - 4, (ya + yb) / 2);
  });
}

function dibujarVolumen(g: CanvasRenderingContext2D, w: number, h: number, r: RelojTransporte) {
  const l = r.lectura;
  const m = ejes(g, w, h, { xa: 150, xb: 500, ya: 50, yb: 175, xRot: 'tonicidad (mOsm/L)', yRot: 'V/V₀ (%)', izq: 30, yMarcas: [50, 100, 150] });
  const { X, Y } = m;
  // lisis y reposo
  g.setLineDash([4, 3]); g.strokeStyle = `${COLOR.lisis}aa`; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(m.x0, Math.round(Y(UMBRAL_LISIS_B2)) + 0.5); g.lineTo(m.x1, Math.round(Y(UMBRAL_LISIS_B2)) + 0.5); g.stroke();
  g.strokeStyle = 'rgba(170,196,214,0.45)';
  g.beginPath(); g.moveTo(Math.round(X(ERITROCITO.osm0)) + 0.5, m.y0); g.lineTo(Math.round(X(ERITROCITO.osm0)) + 0.5, m.y1); g.stroke();
  g.setLineDash([]);
  // Boyle–van 't Hoff: V/V₀ = Osm₀/tonicidad (los solutos impermeantes no salen)
  const pts: [number, number][] = [];
  for (let x = 150; x <= 500; x += 4) pts.push([X(x), Y(Math.min(175, (N_IMPERMEANTE / x / ERITROCITO.V0) * 100))]);
  linea(g, pts, COLOR.agua, 1.8);
  // el punto de la célula (sube o baja hacia la curva mientras entra o sale agua)
  const xp = X(Math.min(500, Math.max(150, l.tonicidad))), yp = Y(Math.min(175, Math.max(50, l.vRel)));
  g.strokeStyle = COLOR.v; g.lineWidth = 2; g.beginPath(); g.arc(xp, yp, 6, 0, Math.PI * 2); g.stroke();
  punto(g, xp, yp, COLOR.v, 3);
  const fam = familia();
  g.font = `700 9.5px ${fam}`; g.textBaseline = 'bottom';
  g.fillStyle = COLOR.lisis; g.textAlign = 'right'; textoHalo(g, 'lisis', m.x1 - 2, Y(UMBRAL_LISIS_B2) - 2);
  g.fillStyle = COL.tenue; g.textAlign = 'left'; textoHalo(g, 'isotónico', X(ERITROCITO.osm0) + 3, m.y1 - 3);
}

function dibujarSaturacion(g: CanvasRenderingContext2D, w: number, h: number, r: RelojTransporte, cual: 'glut' | 'bomba') {
  const l = r.lectura, tC = r.medio.tC;
  const fam = familia();
  if (cual === 'glut') {
    const k = kcatGlut1(tC);
    const yb = Math.max(250, k * 1.12);
    const m = ejes(g, w, h, { xa: 0, xb: RANGO.glucosa[1], ya: 0, yb, xRot: '[glucosa] fuera (mM)', yRot: 'glucosas/s por GLUT1', izq: 30 });
    const { X, Y } = m;
    g.setLineDash([4, 3]); g.strokeStyle = 'rgba(232,168,67,0.6)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(m.x0, Math.round(Y(k)) + 0.5); g.lineTo(m.x1, Math.round(Y(k)) + 0.5); g.stroke();
    g.beginPath(); g.moveTo(Math.round(X(GLUT1.km)) + 0.5, Y(k / 2)); g.lineTo(Math.round(X(GLUT1.km)) + 0.5, m.y1); g.stroke();
    g.setLineDash([]);
    const ent: [number, number][] = [], net: [number, number][] = [];
    for (let s = 0; s <= RANGO.glucosa[1] + 1e-9; s += 0.25) { ent.push([X(s), Y(mm(k, GLUT1.km, s))]); net.push([X(s), Y(Math.max(0, mm(k, GLUT1.km, s) - l.glut.sale))]); }
    linea(g, ent, COLOR.glut, 1.9);
    linea(g, net, `${COLOR.glut}88`, 1.3, [2, 2]);
    punto(g, X(l.gOut), Y(l.glut.entra), COLOR.glut, 3.5);
    if (l.glut.neto > 0.5) punto(g, X(l.gOut), Y(l.glut.neto), COLOR.glut, 3, true);
    g.font = `700 9.5px ${fam}`; g.textBaseline = 'bottom'; g.fillStyle = COL.texto;
    g.textAlign = 'right'; textoHalo(g, `V_max = k_cat = ${cifra(k, 0)}/s`, m.x1 - 2, Y(k) - 2);
    g.textAlign = 'left'; textoHalo(g, `K_m ${cifra(GLUT1.km, 0)} mM`, X(GLUT1.km) + 3, m.y1 - 3);
  } else {
    const vmaxEf = l.bomba.vmaxEf;
    const yb = Math.max(20, vmaxBomba(tC) * 0.62);
    const m = ejes(g, w, h, { xa: 0, xb: RANGO.atp[1], ya: 0, yb, xFmt: (v) => cifra(v, 1), xRot: '[ATP] dentro (mM)', yRot: 'ciclos/s por bomba', izq: 30 });
    const { X, Y } = m;
    g.setLineDash([4, 3]); g.strokeStyle = 'rgba(164,140,228,0.65)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(m.x0, Math.round(Y(vmaxEf)) + 0.5); g.lineTo(m.x1, Math.round(Y(vmaxEf)) + 0.5); g.stroke();
    g.beginPath(); g.moveTo(Math.round(X(BOMBA.kATP)) + 0.5, Y(vmaxEf / 2)); g.lineTo(Math.round(X(BOMBA.kATP)) + 0.5, m.y1); g.stroke();
    g.setLineDash([]);
    const pts: [number, number][] = [];
    for (let a = 0; a <= RANGO.atp[1] + 1e-9; a += 0.02) pts.push([X(a), Y(mm(vmaxEf, BOMBA.kATP, a))]);
    linea(g, pts, COLOR.bomba, 1.9);
    punto(g, X(r.medio.atp), Y(l.bomba.ciclos), COLOR.bomba, 3.5);
    g.font = `700 9.5px ${fam}`; g.textBaseline = 'bottom'; g.fillStyle = COL.texto;
    g.textAlign = 'right'; textoHalo(g, `V_max ${cifra(vmaxEf, 0)}/s (Na⁺ ${cifra(l.bomba.fNa * 100, 0)} %)`, m.x1 - 2, Y(vmaxEf) - 2);
    g.textAlign = 'left'; textoHalo(g, `K_ATP ${cifra(BOMBA.kATP, 1)}`, X(BOMBA.kATP) + 3, m.y1 - 3);
  }
}

// ───────────────────────────── reto ─────────────────────────────

export interface LecturaRetoB2 { nacl: number; glucosa: number; v: number }

function dibujarVt(g: CanvasRenderingContext2D, w: number, h: number, r: RelojReto) {
  const hist = r.historia;
  const tMax = Math.max(r.t * 1.05, 0.05);
  let vMin = 80, vMax = 120;
  for (const p of hist) { vMin = Math.min(vMin, p.v); vMax = Math.max(vMax, p.v); }
  const tope = r.cfg.tipo === 'animal' ? UMBRAL_LISIS_B2 : VMAX_VEGETAL_B2;
  vMax = Math.max(vMax, Math.min(tope + 6, vMax + 6)); vMin = Math.max(0, vMin - 6);
  const f = fmtT(tMax);
  const m = ejes(g, w, h, { xa: 0, xb: tMax, ya: vMin, yb: vMax, xFmt: f, xRot: tMax < 1.5 ? 'ms reales' : 's reales', yRot: 'V/V₀ (%)', izq: 30 });
  const { X, Y } = m;
  if (tope <= vMax) {
    g.setLineDash([4, 3]); g.strokeStyle = r.cfg.tipo === 'animal' ? `${COLOR.lisis}aa` : 'rgba(150,210,120,0.7)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(m.x0, Math.round(Y(tope)) + 0.5); g.lineTo(m.x1, Math.round(Y(tope)) + 0.5); g.stroke(); g.setLineDash([]);
    g.font = `700 9.5px ${familia()}`; g.fillStyle = r.cfg.tipo === 'animal' ? COLOR.lisis : '#a8dc8c'; g.textAlign = 'right'; g.textBaseline = 'bottom';
    textoHalo(g, r.cfg.tipo === 'animal' ? 'lisis' : 'pared (turgencia)', m.x1 - 2, Y(tope) - 2);
  }
  g.strokeStyle = 'rgba(170,196,214,0.3)'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(m.x0, Math.round(Y(100)) + 0.5); g.lineTo(m.x1, Math.round(Y(100)) + 0.5); g.stroke(); g.setLineDash([]);
  linea(g, hist.map((p) => [X(p.t), Y(p.v)]), COLOR.v, 1.9);
  const u = hist[hist.length - 1];
  if (u) punto(g, X(u.t), Y(u.v), COLOR.v, 3);
}

function dibujarLecturas(g: CanvasRenderingContext2D, w: number, h: number, r: RelojReto, lecturas: LecturaRetoB2[], revela: boolean) {
  const xb = 1.2;
  const m = ejes(g, w, h, { xa: 0, xb, ya: 0, yb: 175, xFmt: (v) => cifra(v, 1), xRot: 'Osm del medio (Osm/L)', yRot: 'V/V₀ (%)', izq: 30, yMarcas: [0, 50, 100, 150] });
  const { X, Y } = m;
  const tope = r.cfg.tipo === 'animal' ? UMBRAL_LISIS_B2 : VMAX_VEGETAL_B2;
  g.setLineDash([2, 3]); g.strokeStyle = 'rgba(170,196,214,0.3)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(m.x0, Math.round(Y(100)) + 0.5); g.lineTo(m.x1, Math.round(Y(100)) + 0.5); g.stroke(); g.setLineDash([]);
  if (revela) {
    // la muestra: V/V₀ = Osm₀/Osm_ext (con el tope de la pared o la lisis) y su punto isotónico
    const o0 = r.cfg.osm0;
    const pts: [number, number][] = [];
    for (let x = 0.12; x <= xb + 1e-9; x += 0.01) pts.push([X(x), Y(Math.min(tope, Math.min(175, (o0 / x) * 100)))]);
    linea(g, pts, COLOR.agua, 1.8);
    g.setLineDash([4, 3]); g.strokeStyle = 'rgba(124,200,240,0.7)';
    g.beginPath(); g.moveTo(Math.round(X(o0)) + 0.5, m.y0); g.lineTo(Math.round(X(o0)) + 0.5, m.y1); g.stroke(); g.setLineDash([]);
    g.font = `700 9.5px ${familia()}`; g.fillStyle = COLOR.agua; g.textAlign = 'left'; g.textBaseline = 'top';
    textoHalo(g, `Osm₀ = ${cifra(o0, 3)}`, X(o0) + 3, m.y0 + 12);
  }
  for (const lec of lecturas) punto(g, X(Math.min(xb, 2 * lec.nacl + lec.glucosa)), Y(Math.min(175, lec.v)), COLOR.v, 3.5);
  // el medio actual (hueco): su V es la de ahora, aún puede estar cambiando
  punto(g, X(Math.min(xb, r.osmExt)), Y(Math.min(175, r.V)), COLOR.v, 5, true);
}

function TablaLecturas({ lecturas, compacto }: { lecturas: LecturaRetoB2[]; compacto: boolean }) {
  if (lecturas.length === 0) {
    return <div className="flex min-h-0 flex-1 items-center justify-center rounded-md bg-[#0a131c] px-3 text-center text-[11px] text-slate-400 ring-1 ring-black/40">Anota la lectura cuando el volumen deje de cambiar.</div>;
  }
  const filas = lecturas.slice(compacto ? -3 : -5);
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-md bg-[#0a131c] px-2 py-1 ring-1 ring-black/40">
      <table className="w-full font-mono text-[10.5px] tabular-nums text-slate-200">
        <thead><tr className="text-[9.5px] text-slate-400"><th className="text-left font-semibold">NaCl M</th><th className="text-left font-semibold">gluc. M</th><th className="text-right font-semibold">Osm/L</th><th className="text-right font-semibold">V/V₀</th></tr></thead>
        <tbody>
          {filas.map((l, i) => (
            <tr key={i}><td>{cifra(l.nacl, 3)}</td><td>{cifra(l.glucosa, 2)}</td><td className="text-right">{cifra(2 * l.nacl + l.glucosa, 3)}</td><td className="text-right">{cifra(l.v, 1)} %</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────────── dock ─────────────────────────────

export interface DockB2Props {
  vista: VistaB2;
  relojE: React.MutableRefObject<RelojTransporte>;
  relojR: React.MutableRefObject<RelojReto>;
  lecturas: LecturaRetoB2[];
  /** reto validado: se dibuja la curva de la muestra */
  revela: boolean;
}

type PanelE = 'gradientes' | 'volumen' | 'saturacion';
type PanelR = 'vt' | 'lecturas' | 'tabla';
const NOMBRE_E: Record<PanelE, string> = { gradientes: 'Gradientes', volumen: 'Volumen', saturacion: 'Saturación' };
const NOMBRE_R: Record<PanelR, string> = { vt: 'V(t)', lecturas: 'Mis lecturas', tabla: 'Tabla' };

function Pestanas<T extends string>({ valor, opciones, nombres, onChange }: { valor: T; opciones: T[]; nombres: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5" role="tablist">
      {opciones.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={valor === o} onClick={() => onChange(o)}
          className={`h-5 rounded-full px-2 text-[10px] font-semibold ${valor === o ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
          {nombres[o]}
        </button>
      ))}
    </div>
  );
}

function Interruptor({ valor, onChange }: { valor: 'glut' | 'bomba'; onChange: (v: 'glut' | 'bomba') => void }) {
  return (
    <span className="flex rounded-full border border-white/10 p-px">
      {(['glut', 'bomba'] as const).map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={valor === v}
          className={`h-4 rounded-full px-1.5 text-[9.5px] font-semibold ${valor === v ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}>
          {v === 'glut' ? 'GLUT1' : 'Bomba'}
        </button>
      ))}
    </span>
  );
}

export function DockB2({ vista, relojE, relojR, lecturas, revela }: DockB2Props) {
  const caja = useRef<HTMLDivElement>(null);
  const ancho = useAncho(caja);
  const estrecho = ancho < 760;
  const compacto = ancho < 560;
  const reto = vista === 'reto';
  const reloj = (reto ? relojR : relojE) as unknown as React.MutableRefObject<ConVersion>;
  useTickReloj(reloj, 8);
  const [pe, setPe] = useState<PanelE>('gradientes');
  const [pr, setPr] = useState<PanelR>('vt');
  const [sat, setSat] = useState<'glut' | 'bomba'>('glut');
  const l = relojE.current.lectura;
  const R = relojR.current;

  const panelesE: Record<PanelE, (c?: React.ReactNode) => React.ReactNode> = {
    gradientes: (c) => (
      <Panel cabecera={c} titulo="Gradientes" dato={relojE.current.estado.t < 1.5 ? `t = ${cifra(relojE.current.estado.t * 1000, 0)} ms` : `t = ${cifra(relojE.current.estado.t, 1)} s`}>
        <Lienzo reloj={reloj} etiqueta="Gradientes de agua (osmolaridad), glucosa, oxígeno y sodio frente al tiempo real" deps={[vista]}
          dibujar={(g, w, h) => dibujarGradientes(g, w, h, relojE.current)} />
      </Panel>
    ),
    volumen: (c) => (
      <Panel cabecera={c} titulo="Volumen y tonicidad" dato={<span title="Presión osmótica dentro / fuera (Π = Osm·R·T)">Π {cifra(l.piIn, 2)} / {cifra(l.piOut, 2)} atm</span>}>
        <Lienzo reloj={reloj} etiqueta="Volumen relativo de la célula frente a la tonicidad del medio, con la curva de Boyle–van 't Hoff" deps={[vista]}
          dibujar={(g, w, h) => dibujarVolumen(g, w, h, relojE.current)} />
      </Panel>
    ),
    saturacion: (c) => (
      <Panel cabecera={c} titulo="Saturación" extra={<Interruptor valor={sat} onChange={setSat} />}
        dato={sat === 'glut' ? `${cifra(l.glut.neto, 0)}/s neto` : `${cifra(l.bomba.ciclos, 1)} ciclos/s`}>
        <Lienzo reloj={reloj} etiqueta={sat === 'glut' ? 'Flujo de glucosa por GLUT1 frente a la glucosa de fuera (Michaelis–Menten)' : 'Ciclos de la bomba de sodio y potasio frente al ATP (Michaelis–Menten)'} deps={[vista, sat]}
          dibujar={(g, w, h) => dibujarSaturacion(g, w, h, relojE.current, sat)} />
      </Panel>
    ),
  };
  const tend = R.lisada ? 'lisada' : R.tendencia === 'estable' ? 'estable' : R.tendencia === 'gana' ? 'entra agua' : 'sale agua';
  const panelesR: Record<PanelR, (c?: React.ReactNode) => React.ReactNode> = {
    vt: (c) => (
      <Panel cabecera={c} titulo="Volumen de la muestra" dato={`${cifra(R.V, 1)} % · ${tend}`}>
        <Lienzo reloj={reloj} etiqueta="Volumen relativo de la muestra frente al tiempo real" deps={[vista]} dibujar={(g, w, h) => dibujarVt(g, w, h, relojR.current)} />
      </Panel>
    ),
    lecturas: (c) => (
      <Panel cabecera={c} titulo="Mis lecturas" dato={`Π medio ${cifra(presionOsmotica(R.osmExt, R.cfg.tC), 2)} atm`}>
        <Lienzo reloj={reloj} etiqueta="Volumen relativo frente a la osmolaridad del medio en las lecturas anotadas" deps={[vista, lecturas, revela]}
          dibujar={(g, w, h) => dibujarLecturas(g, w, h, relojR.current, lecturas, revela)} />
      </Panel>
    ),
    tabla: (c) => (
      <Panel cabecera={c} titulo="Tabla de lecturas" dato={lecturas.length ? `${lecturas.length}` : undefined}>
        <TablaLecturas lecturas={lecturas} compacto={compacto} />
      </Panel>
    ),
  };

  return (
    <div ref={caja} className={`flex shrink-0 flex-col border-t border-white/10 bg-[#0c1620] ${compacto ? 'h-[150px] p-1.5' : 'h-[clamp(132px,25%,200px)] p-2'}`}
      data-dock-b2={reto ? 'reto' : 'exploracion'} data-estrecho={estrecho ? '' : undefined}>
      {estrecho ? (
        <div className="flex min-h-0 flex-1">
          {reto
            ? panelesR[pr](<Pestanas<PanelR> valor={pr} opciones={['vt', 'lecturas', 'tabla']} nombres={NOMBRE_R} onChange={setPr} />)
            : panelesE[pe](<Pestanas<PanelE> valor={pe} opciones={['gradientes', 'volumen', 'saturacion']} nombres={NOMBRE_E} onChange={setPe} />)}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-2.5">
          {reto
            ? (['vt', 'lecturas', 'tabla'] as PanelR[]).map((k) => <React.Fragment key={k}>{panelesR[k]()}</React.Fragment>)
            : (['gradientes', 'volumen', 'saturacion'] as PanelE[]).map((k) => <React.Fragment key={k}>{panelesE[k]()}</React.Fragment>)}
        </div>
      )}
    </div>
  );
}
