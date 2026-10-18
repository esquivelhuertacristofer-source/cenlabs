'use client';
/**
 * fis06/Dock.tsx — el dock de instrumentos bajo la escena, en DOM nítido (lienzo a
 * devicePixelRatio, tipografía del lab). Lee EL MISMO reloj que la escena: se redibuja
 * cuando el reloj integra un cuadro nuevo.
 *
 *  · EXPLORAR: barras de las fuerzas (peso P, empuje E, apoyo del fondo N) con P = E + N,
 *    fracción sumergida frente a ρ_c/ρ_l, estabilidad (GM) o velocidad límite; y la gráfica
 *    z(t) de G respecto a la superficie con el ángulo θ(t) en el mismo eje de tiempo.
 *  · RETO: la lectura del dinamómetro (lo único que mide el alumno) y su traza T(t). Las
 *    barras P, E y T sólo aparecen tras validar: su proporción daría la densidad.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { lecturaDinamometro } from '@/domain/fisica';
import {
  G, alturaMetacentrica, alcanceDinamometro, flota, fraccionEquilibrio, peso, velocidadTerminal, volumen,
  type Liquido,
} from './flotacion';
import { VENTANA, type RelojTanque } from './reloj';

// ───────────────────────────── formato ─────────────────────────────

const MENOS = '−';
/** Cifra con coma decimal (es-MX formatea a la inglesa) y signo tipográfico. */
export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const cero = Number(abs) === 0;
  const cuerpo = abs.replace('.', ',');
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + cuerpo;
}

/** Re-render a ≤ hz cuando el reloj integra un cuadro (o cambia de reloj). */
export function useTickReloj(reloj: React.MutableRefObject<RelojTanque>, hz = 20): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimoR: RelojTanque | null = null, t0 = 0;
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
const COL = { rejilla: 'rgba(148,180,205,0.13)', eje: 'rgba(170,196,214,0.6)', texto: 'rgba(214,228,240,0.88)', tenue: 'rgba(170,196,214,0.55)' };
export const COLOR = { P: '#ffad3b', E: '#3fd2ff', N: '#aab6c2', T: '#7be08f', th: '#c79bff' };

function pasoBonito(rango: number, n = 4) {
  const bruto = rango / n;
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto) return k * p;
  return 10 * p;
}

// ───────────────────────────── gráfica ─────────────────────────────

/** z(t) y θ(t) (explorar) o T(t) (reto) con el MISMO eje de tiempo del reloj. */
function dibujarGrafica(g: CanvasRenderingContext2D, w: number, h: number, r: RelojTanque, reto: boolean, zEq: number | null) {
  g.fillStyle = '#0a1220'; g.fillRect(0, 0, w, h);
  const fam = familia();
  const izq = 34, der = reto ? 10 : 30, arriba = 18, abajo = 16;
  const x0 = izq, x1 = w - der, y0 = arriba, y1 = h - abajo;
  if (x1 - x0 < 30 || y1 - y0 < 20) return;
  const tFin = Math.max(VENTANA, r.s.t), tIni = tFin - VENTANA;
  // rango vertical: de los datos de la ventana (y el equilibrio)
  let vMin = Infinity, vMax = -Infinity, thMax = 0.05;
  r.forEach((t, z, th, T) => {
    if (t < tIni) return;
    const v = reto ? T : z * 100;
    vMin = Math.min(vMin, v); vMax = Math.max(vMax, v);
    thMax = Math.max(thMax, Math.abs(th) * 180 / Math.PI);
  });
  if (zEq !== null) { vMin = Math.min(vMin, zEq * 100); vMax = Math.max(vMax, zEq * 100); }
  if (!Number.isFinite(vMin)) { vMin = 0; vMax = 1; }
  if (vMax - vMin < (reto ? 0.5 : 1)) { const c = (vMax + vMin) / 2, m = reto ? 0.25 : 0.5; vMin = c - m; vMax = c + m; }
  const pad = (vMax - vMin) * 0.1; vMin -= pad; vMax += pad;
  const thEsc = thMax <= 10 ? 10 : thMax <= 45 ? 45 : thMax <= 90 ? 90 : 180;
  const X = (t: number) => x0 + ((t - tIni) / VENTANA) * (x1 - x0);
  const Y = (v: number) => y1 - ((v - vMin) / (vMax - vMin)) * (y1 - y0);
  const Yth = (d: number) => (y0 + y1) / 2 - (d / thEsc) * ((y1 - y0) / 2);
  // rejilla
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  const pv = pasoBonito(vMax - vMin, Math.max(2, Math.round((y1 - y0) / 34)));
  const marcasV: number[] = [];
  for (let v = Math.ceil(vMin / pv) * pv; v <= vMax + 1e-9; v += pv) { marcasV.push(v); const y = Math.round(Y(v)) + 0.5; g.moveTo(x0, y); g.lineTo(x1, y); }
  const pt = pasoBonito(VENTANA, Math.max(2, Math.round((x1 - x0) / 70)));
  for (let t = Math.ceil(tIni / pt) * pt; t <= tFin + 1e-9; t += pt) { const x = Math.round(X(t)) + 0.5; g.moveTo(x, y0); g.lineTo(x, y1); }
  g.stroke();
  g.font = `500 9.5px ${fam}`; g.fillStyle = COL.tenue; g.textBaseline = 'middle'; g.textAlign = 'right';
  const decV = pv < 0.1 ? 2 : pv < 1 ? 1 : 0;
  for (const v of marcasV) g.fillText(cifra(v, decV), x0 - 4, Y(v));
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let t = Math.ceil(tIni / pt) * pt; t <= tFin + 1e-9; t += pt) { const x = X(t); if (x < x1 - 14) g.fillText(cifra(t, pt < 1 ? 1 : 0), x, y1 + 3); }
  g.textAlign = 'right'; g.fillText('s', x1, y1 + 3);
  // eje θ a la derecha
  if (!reto) {
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(199,155,255,0.75)';
    for (const d of [-thEsc, 0, thEsc]) g.fillText(`${d > 0 ? '+' : d < 0 ? MENOS : ''}${Math.abs(d)}°`, x1 + 4, Yth(d));
  }
  // equilibrio
  if (zEq !== null) {
    g.setLineDash([4, 4]); g.strokeStyle = 'rgba(63,210,255,0.55)'; g.beginPath();
    const y = Math.round(Y(zEq * 100)) + 0.5; g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.setLineDash([]);
  }
  // trazas
  g.save(); g.beginPath(); g.rect(x0, y0 - 2, x1 - x0, y1 - y0 + 4); g.clip();
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (!reto) {
    g.strokeStyle = COLOR.th; g.globalAlpha = 0.8; g.lineWidth = 1.2; g.beginPath();
    let pr = true;
    r.forEach((t, _z, th) => { if (t < tIni) return; const x = X(t), y = Yth(th * 180 / Math.PI); if (pr) { g.moveTo(x, y); pr = false; } else g.lineTo(x, y); });
    g.stroke(); g.globalAlpha = 1;
  }
  g.strokeStyle = reto ? COLOR.T : '#ffe08a'; g.lineWidth = 1.8; g.beginPath();
  let primero = true;
  r.forEach((t, z, _th, T) => { if (t < tIni) return; const x = X(t), y = Y(reto ? T : z * 100); if (primero) { g.moveTo(x, y); primero = false; } else g.lineTo(x, y); });
  g.stroke();
  g.restore();
  // cursor del instante y leyenda
  const xc = Math.round(X(r.s.t)) + 0.5;
  g.strokeStyle = 'rgba(255,224,138,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xc, y0); g.lineTo(xc, y1); g.stroke();
  g.font = `600 10px ${fam}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const items: [string, string][] = reto ? [['T (dinamómetro), N', COLOR.T]] : [['z de G, cm', '#ffe08a'], ['θ', COLOR.th]];
  let cx = x0;
  for (const [t, c] of items) { g.fillStyle = c; g.fillRect(cx, 8, 12, 2.5); g.fillStyle = COL.texto; g.fillText(t, cx + 16, 9); cx += 26 + g.measureText(t).width; }
  if (zEq !== null && cx + 80 < x1) { g.setLineDash([3, 3]); g.strokeStyle = 'rgba(63,210,255,0.7)'; g.beginPath(); g.moveTo(cx, 9.5); g.lineTo(cx + 12, 9.5); g.stroke(); g.setLineDash([]); g.fillStyle = COL.texto; g.fillText('equilibrio', cx + 16, 9); }
}

function Grafica({ reloj, reto, zEq }: { reloj: React.MutableRefObject<RelojTanque>; reto: boolean; zEq: number | null }) {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = caja.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const datos = useRef({ reto, zEq }); datos.current = { reto, zEq };
  useEffect(() => {
    const c = lienzo.current; if (!c || tam.w < 20 || tam.h < 20) return;
    let id = 0, ultima = -1, ultimoR: RelojTanque | null = null, forzar = true;
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
      dibujarGrafica(g, tam.w, tam.h, r, datos.current.reto, datos.current.zEq);
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, [reloj, tam.w, tam.h, reto, zEq]);
  return (
    <div ref={caja} className="relative min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-black/40">
      <canvas ref={lienzo} className="absolute inset-0 h-full w-full" role="img"
        aria-label={reto ? 'Lectura del dinamómetro frente al tiempo' : 'Altura del centro de masa respecto a la superficie y ángulo del cuerpo frente al tiempo'} />
    </div>
  );
}

// ───────────────────────────── barras de fuerzas ─────────────────────────────

function Barra({ etiqueta, valor, max, color, titulo, compacto }: { etiqueta: string; valor: number; max: number; color: string; titulo: string; compacto?: boolean }) {
  const w = Math.max(0, Math.min(1, valor / max));
  return (
    <div className="flex items-center gap-1.5" title={titulo}>
      <span className="w-3.5 shrink-0 text-[11px] font-bold" style={{ color }}>{etiqueta}</span>
      <div className={`relative ${compacto ? 'h-[7px]' : 'h-[9px]'} min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]`}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${w * 100}%`, background: color, opacity: 0.85 }} />
      </div>
      <span className={`${compacto ? 'w-[46px] text-[10.5px]' : 'w-[52px] text-[11px]'} shrink-0 text-right font-mono tabular-nums text-white`}>{cifra(valor, 2)} N</span>
    </div>
  );
}

/** Ancho del dock (para el modo compacto de los móviles: < 560 px). */
function useAncho(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(1000);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function Chip({ children, tono = 'neutro', titulo }: { children: React.ReactNode; tono?: 'neutro' | 'bien' | 'mal'; titulo?: string }) {
  const c = tono === 'bien' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : tono === 'mal' ? 'border-rose-400/30 bg-rose-500/10 text-rose-100' : 'border-white/10 bg-white/[0.04] text-slate-200';
  return <span title={titulo} className={`whitespace-nowrap rounded-md border px-1 py-px font-mono text-[10px] tabular-nums ${c}`}>{children}</span>;
}

export interface DockProps {
  reloj: React.MutableRefObject<RelojTanque>;
  reto: boolean;
  liq: Liquido;
  /** reto validado: se revelan las fuerzas */
  validado: boolean;
}

export function DockF6({ reloj, reto, liq, validado }: DockProps) {
  useTickReloj(reloj, 15);
  const caja = useRef<HTMLDivElement>(null);
  const compacto = useAncho(caja) < 560;
  const r = reloj.current, s = r.s, c = r.m.c;
  const P = peso(c), Emax = liq.rho * G * volumen(c);
  const max = Math.max(P, Emax) * 1.02;
  const fr = s.V / volumen(c);
  const flotaC = flota(c, liq);
  const gm = alturaMetacentrica(c, liq);
  // equilibrio de la gráfica (explorar, sólo si flota): G respecto a la superficie en su
  // postura estable (si la elegida es inestable, acaba tumbado sobre su cara ancha)
  let zEq: number | null = null;
  if (!reto && flotaC) {
    const hEstable = gm.GM >= 0 ? c.h : c.b;
    zEq = hEstable / 2 - fraccionEquilibrio(c.rho, liq.rho) * hEstable;
  }
  const lectura = lecturaDinamometro(s.T);
  const alcance = alcanceDinamometro(P);

  return (
    <div ref={caja} className={`flex shrink-0 gap-2 border-t border-white/10 bg-[#0c1524] ${compacto ? 'h-[132px] p-1.5' : 'h-[clamp(128px,25%,196px)] p-2'}`}
      data-dock-f6={reto ? 'reto' : 'explorar'} data-compacto={compacto ? '' : undefined}>
      <div className={`flex min-h-0 shrink-0 flex-col justify-center text-[11px] text-slate-300 ${compacto ? 'w-[56%] gap-1' : 'w-[clamp(150px,38%,232px)] gap-1.5'}`}>
        {reto ? (
          <>
            <div className={`flex items-baseline justify-between gap-2 rounded-lg border border-[#7be08f]/25 bg-[#7be08f]/[0.07] ${compacto ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} data-lectura-dinamometro="">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a8f0b6]">Dinamómetro</span>
              <span className={`font-mono font-bold tabular-nums text-white ${compacto ? 'text-[16px]' : 'text-[19px]'}`}>{cifra(lectura, 2)}<span className="ml-1 text-[11px] font-semibold text-slate-400">N</span></span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Chip titulo="Alcance de la escala">0–{alcance} N</Chip>
              <Chip titulo="Fracción del cilindro bajo la superficie">sumergido {Math.round(fr * 100)} %</Chip>
            </div>
            {validado && (
              <div className={`flex flex-col ${compacto ? 'gap-0.5' : 'gap-1'}`} data-fuerzas-validadas="">
                <Barra compacto={compacto} etiqueta="P" valor={s.P} max={max} color={COLOR.P} titulo="Peso: m·g" />
                <Barra compacto={compacto} etiqueta="E" valor={s.E} max={max} color={COLOR.E} titulo="Empuje: ρ_l·g·V_sumergido" />
                <Barra compacto={compacto} etiqueta="T" valor={s.T} max={max} color={COLOR.T} titulo="Tensión del hilo = lectura" />
              </div>
            )}
          </>
        ) : (
          <>
            <Barra compacto={compacto} etiqueta="P" valor={s.P} max={max} color={COLOR.P} titulo="Peso: m·g" />
            <Barra compacto={compacto} etiqueta="E" valor={s.E} max={max} color={COLOR.E} titulo="Empuje: ρ_l·g·V_sumergido" />
            <Barra compacto={compacto} etiqueta="N" valor={s.N} max={max} color={COLOR.N} titulo="Apoyo del fondo" />
            <div className="flex flex-wrap gap-1">
              <Chip titulo="Volumen sumergido / volumen del cuerpo">V<sub>s</sub>/V {cifra(fr * 100, 0)} %</Chip>
              <Chip titulo="Densidad del cuerpo / densidad del líquido">ρ<sub>c</sub>/ρ<sub>l</sub> {cifra(c.rho / liq.rho, 2)}</Chip>
              {flotaC ? (
                <Chip tono={gm.GM >= 0 ? 'bien' : 'mal'} titulo="Altura metacéntrica GM = KB + BM − KG de la postura elegida">GM {cifra(gm.GM * 100, 1, true)} cm</Chip>
              ) : (
                <Chip titulo="Velocidad límite al hundirse tumbado (arrastre de White)">v<sub>lím</sub> {cifra(velocidadTerminal(c, liq), 2)} m/s</Chip>
              )}
            </div>
          </>
        )}
      </div>
      <Grafica reloj={reloj} reto={reto} zEq={zEq} />
    </div>
  );
}
