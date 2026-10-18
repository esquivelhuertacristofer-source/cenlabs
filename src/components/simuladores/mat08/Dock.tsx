'use client';
/**
 * mat08/Dock.tsx — el dock de instrumentos del banco de la derivada, en DOM nítido
 * (lienzos a devicePixelRatio, tipografía del lab). Lee el MISMO reloj que la escena
 * (`RelojDerivada`): cada vez que la escena integra un cuadro sube `version` y el dock se
 * redibuja con ese estado, así que cifras, curvas y haces coinciden.
 *
 *  - Pendiente: el límite f′(x₀) y el cociente incremental de la secante dibujada, con su h.
 *  - f y f′ con un cursor común en x₀ (concavidad sombreada, puntos críticos e inflexiones).
 *  - Tabla h → pendiente: delante y centrada para h = 1 … 10⁻⁴; en verde las cifras que ya
 *    coinciden con el límite.
 *  - Error |D(h) − f′(x₀)| en log–log de h = 10⁻¹² a 1: rectas de pendiente 1 y 2
 *    (truncamiento) y la subida del redondeo a la izquierda; el orden medido.
 *
 * NO REGALAR. En el reto, antes de validar, el panel de v(t) sólo tiene el punto de ahora y
 * las mediciones del alumno; ni la curva v(t), ni la concavidad de s, ni el orden medido
 * (que salta a 2 justo en la inflexión) se muestran.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { barridoError, ordenMedido, num, H_TABLA, prefijoComun, cocienteAdelante, cocienteCentrado, marcas } from './derivada';
import type { RelojDerivada } from './reloj';

// ───────────────────────────── reloj → React ─────────────────────────────

/** Re-render a ≤ `hz` cuando el reloj integra un cuadro nuevo (o cambia de reloj). */
export function useTickReloj(reloj: React.MutableRefObject<RelojDerivada>, hz = 20): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimoR: RelojDerivada | null = null, t0 = 0;
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

// ───────────────────────────── lienzos ─────────────────────────────

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');

/** Lienzo que se ajusta al ancho de su contenedor y dibuja a devicePixelRatio. */
function Lienzo({ alto, dibujar, deps, etiqueta }: {
  alto: number; dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; deps: unknown[]; etiqueta: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [ancho, setAncho] = useState(0);
  useLayoutEffect(() => {
    const el = caja.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = lienzo.current; if (!c || ancho < 10 || alto < 10) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const W = Math.round(ancho * dpr), H = Math.round(alto * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);
    dibujar(ctx, ancho, alto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancho, alto, ...deps]);
  return (
    <div ref={caja} className="w-full">
      <canvas ref={lienzo} role="img" aria-label={etiqueta} style={{ width: '100%', height: alto, display: 'block' }} />
    </div>
  );
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
/** 10ⁿ con el exponente en superíndice (1 para n = 0). */
export const pot10 = (n: number) => (n === 0 ? '1' : `10${String(n).split('').map((ch) => SUP[ch] ?? ch).join('')}`);

const COL = { f: '#38d9f5', sec: '#ffb43a', tan: '#ff4fa3', crit: '#9ff5cf', infl: '#c9a7ff', eje: 'rgba(148,163,184,0.45)', rej: 'rgba(148,163,184,0.12)', txt: '#94a3b8' };

interface Marco { X: (v: number) => number; Y: (v: number) => number; m: { l: number; r: number; t: number; b: number } }

/** Ejes lineales con rejilla y números. */
function ejes(ctx: CanvasRenderingContext2D, w: number, h: number, o: {
  x0: number; x1: number; y0: number; y1: number; yLabel: string; xLabel?: string; numX?: boolean;
}): Marco {
  const m = { l: 30, r: 6, t: 6, b: o.numX ? 16 : 5 };
  const X = (v: number) => m.l + ((v - o.x0) / (o.x1 - o.x0)) * (w - m.l - m.r);
  const Y = (v: number) => h - m.b - ((v - o.y0) / (o.y1 - o.y0)) * (h - m.t - m.b);
  const f = familia();
  const xt = marcas(o.x0, o.x1, 5), yt = marcas(o.y0, o.y1, h > 70 ? 3 : 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = COL.rej;
  for (const t of xt) { ctx.beginPath(); ctx.moveTo(Math.round(X(t)) + 0.5, m.t); ctx.lineTo(Math.round(X(t)) + 0.5, h - m.b); ctx.stroke(); }
  for (const t of yt) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(t)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(t)) + 0.5); ctx.stroke(); }
  ctx.strokeStyle = COL.eje;
  ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
  if (o.y0 < 0 && o.y1 > 0) { ctx.strokeStyle = 'rgba(203,213,225,0.4)'; ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(0)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(0)) + 0.5); ctx.stroke(); }
  ctx.fillStyle = COL.txt; ctx.font = `500 9.5px ${f}`;
  const dY = (yt[1] ?? 1) - (yt[0] ?? 0) < 1 ? 1 : 0;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of yt) ctx.fillText(num(t, dY), m.l - 4, Y(t));
  if (o.numX) {
    const dX = (xt[1] ?? 1) - (xt[0] ?? 0) < 1 ? 1 : 0;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of xt) ctx.fillText(num(t, dX), X(t), h - m.b + 3);
  }
  ctx.font = `600 10px ${f}`; ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(o.yLabel, m.l + 4, m.t);
  if (o.xLabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xLabel, w - m.r - 2, h - m.b - 2); }
  return { X, Y, m };
}

function trazo(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, ancho: number, rayas: number[] = []) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(rayas); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.setLineDash([]);
}
function punto(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 3.5) {
  ctx.fillStyle = color; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

/** Tarjeta de un instrumento (fuera del dock: si se definiera dentro, React reharía los lienzos en cada cuadro). */
function Seccion({ titulo, extra, children, className = '' }: { titulo: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-2 ${className}`}>
      <div className="mb-1 flex min-h-[14px] items-center justify-between gap-2">
        <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">{titulo}</span>
        {extra}
      </div>
      {children}
    </section>
  );
}

// ───────────────────────────── dock ─────────────────────────────

export interface DockProps {
  reloj: React.MutableRefObject<RelojDerivada>;
  /** ¿se puede mostrar la derivada exacta? (exploración, o reto ya validado) */
  revela: boolean;
  /** columna lateral o franja bajo la escena */
  orientacion: 'columna' | 'fila';
  /** alto disponible (px) */
  alto: number;
  ancho: number;
}

/** Cifras de la tabla: 5 decimales (4 si |v| ≥ 10). */
const cifraTabla = (v: number) => num(v, Math.abs(v) >= 10 ? 4 : 5);

export function DockDerivada({ reloj, revela, orientacion, alto, ancho }: DockProps) {
  const tick = useTickReloj(reloj);
  const [vista, setVista] = useState<'tabla' | 'error'>('tabla');
  const r = reloj.current;
  const c = r.curva, l = r.lectura(), rg = r.rangos;
  const reto = r.modo === 'reto';
  const [a, b] = c.dominio;
  const v = c.v;
  const uD = c.uD ? ` ${c.uD}` : '';

  // ── f y f′ ──
  const dibujarF = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { X, Y, m } = ejes(ctx, w, h, { x0: a, x1: b, y0: rg.f[0], y1: rg.f[1], yLabel: reto ? 's' : 'f' });
    // concavidad (sólo si se puede ver: en el reto su cambio ES la respuesta)
    if (revela) {
      const N = 160;
      for (let i = 0; i < N; i++) {
        const x = a + ((b - a) * (i + 0.5)) / N, s = c.d2(x);
        if (Math.abs(s) < 1e-12) continue;
        ctx.fillStyle = s > 0 ? 'rgba(56,189,248,0.07)' : 'rgba(244,114,182,0.07)';
        ctx.fillRect(X(a + ((b - a) * i) / N), m.t, X(a + ((b - a) * (i + 1)) / N) - X(a + ((b - a) * i) / N) + 0.5, h - m.t - m.b);
      }
    }
    trazo(ctx, Array.from({ length: 161 }, (_, i) => { const x = a + ((b - a) * i) / 160; return [X(x), Y(c.f(x))] as [number, number]; }), COL.f, 1.8);
    // secante y tangente, como en la escena
    const xL = l.metodo === 'centrada' ? l.x0 - l.hAbs : l.x0, yL = l.metodo === 'centrada' ? l.fM : l.fx;
    const recta = (x0: number, y0: number, p: number, col: string, an: number) => {
      const xs = [a, b].map((x) => [X(x), Y(y0 + p * (x - x0))] as [number, number]);
      ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t, w - m.l - m.r, h - m.t - m.b); ctx.clip();
      trazo(ctx, xs, col, an); ctx.restore();
    };
    recta(l.x0, l.fx, l.d1, COL.tan, 1.4);
    recta(xL, yL, l.d, COL.sec, 1.2);
    if (revela || !reto) for (const p of r.criticos) punto(ctx, X(p.x), Y(c.f(p.x)), COL.crit, 2.6);
    if (revela) for (const p of r.inflexiones) punto(ctx, X(p.x), Y(c.f(p.x)), COL.infl, 2.6);
    // cursor común
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(Math.round(X(l.x0)) + 0.5, m.t); ctx.lineTo(Math.round(X(l.x0)) + 0.5, h - m.b); ctx.stroke(); ctx.setLineDash([]);
    if (l.metodo === 'adelante') punto(ctx, X(l.x0 + l.h), Y(l.fP), COL.sec, 2.8);
    else { punto(ctx, X(l.x0 - l.hAbs), Y(l.fM), COL.sec, 2.8); punto(ctx, X(l.x0 + l.hAbs), Y(c.f(l.x0 + l.hAbs)), COL.sec, 2.8); }
    punto(ctx, X(l.x0), Y(l.fx), '#ffffff', 3.4);
  };
  const dibujarD = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { X, Y, m } = ejes(ctx, w, h, { x0: a, x1: b, y0: rg.d[0], y1: rg.d[1], yLabel: reto ? 'v' : 'f′', xLabel: v, numX: true });
    if (revela) {
      const N = 200;
      const pts = Array.from({ length: N + 1 }, (_, i) => { const x = a + ((b - a) * i) / N; return [X(x), Y(c.d1(x))] as [number, number]; });
      if (!reto) trazo(ctx, pts, 'rgba(255,79,163,0.28)', 1.2, [3, 3]);
      // la parte ya trazada (la de la escena), brillante
      ctx.save(); ctx.beginPath();
      const nb = r.visitado.length;
      for (let i = 0; i < nb; i++) if (r.visitado[i]) ctx.rect(X(a + ((b - a) * i) / nb) - 0.5, m.t, (w - m.l - m.r) / nb + 1, h - m.t - m.b);
      ctx.clip(); trazo(ctx, pts, COL.tan, 1.9); ctx.restore();
      for (const p of r.inflexiones) if (!reto || r.descubierto(p.x)) {
        punto(ctx, X(p.x), Y(c.d1(p.x)), COL.infl, 2.8);
        if (reto) {
          ctx.strokeStyle = 'rgba(201,167,255,0.7)'; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(X(p.x), m.t); ctx.lineTo(X(p.x), h - m.b); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      if (!reto) for (const p of r.criticos) punto(ctx, X(p.x), Y(0), COL.crit, 2.6);
    }
    // mediciones del alumno (reto)
    if (reto) for (const md of r.mediciones) punto(ctx, X(md.t), Y(md.v), '#ffd1e8', 2.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(Math.round(X(l.x0)) + 0.5, m.t); ctx.lineTo(Math.round(X(l.x0)) + 0.5, h - m.b); ctx.stroke(); ctx.setLineDash([]);
    punto(ctx, X(l.x0), Y(l.d1), COL.tan, 3.6);
  };

  // ── error log–log ──
  const verOrden = !reto || revela;
  const oAd = verOrden ? ordenMedido(c, l.x0, 'adelante') : null;
  const oCe = verOrden ? ordenMedido(c, l.x0, 'centrada') : null;
  const dibujarError = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = { l: 32, r: 6, t: 6, b: 16 };
    const X = (lh: number) => m.l + ((lh + 12) / 12) * (w - m.l - m.r);
    const Y = (le: number) => h - m.b - ((le + 16) / 17) * (h - m.t - m.b);
    const f = familia();
    ctx.lineWidth = 1; ctx.strokeStyle = COL.rej;
    for (let k = -12; k <= 0; k += 3) { ctx.beginPath(); ctx.moveTo(Math.round(X(k)) + 0.5, m.t); ctx.lineTo(Math.round(X(k)) + 0.5, h - m.b); ctx.stroke(); }
    for (let k = -16; k <= 0; k += 4) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(k)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(k)) + 0.5); ctx.stroke(); }
    ctx.strokeStyle = COL.eje;
    ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
    ctx.fillStyle = COL.txt; ctx.font = `500 9px ${f}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const k of [-12, -8, -4, 0]) ctx.fillText(pot10(k), X(k), h - m.b + 3);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const k of [-16, -8, 0]) ctx.fillText(pot10(k), m.l - 3, Y(k));
    // rectas de referencia O(h) y O(h²) (truncamiento)
    const ref = (p: number, y0: number, col: string, txt: string) => {
      trazo(ctx, [[X(-5), Y(y0 - 5 * p)], [X(0), Y(y0)]].map(([x, y]) => [x, y]) as [number, number][], col, 1, [4, 3]);
      ctx.fillStyle = col; ctx.font = `600 9.5px ${f}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(txt, X(-5) + 2, Y(y0 - 5 * p) - 2);
    };
    ref(1, 0.5, 'rgba(255,180,58,0.55)', 'h');
    ref(2, -0.8, 'rgba(201,167,255,0.6)', 'h²');
    for (const met of ['adelante', 'centrada'] as const) {
      const col = met === 'adelante' ? COL.sec : COL.infl;
      // un error EXACTAMENTE cero (la resta dio justo f′ por redondeo) no cabe en escala log: se corta el trazo, no se clava al piso
      const tramos: [number, number][][] = [[]];
      for (const p of barridoError(c, l.x0, met)) {
        if (p.e > 0) tramos[tramos.length - 1].push([X(Math.log10(p.h)), Y(Math.max(-16, Math.log10(p.e)))]);
        else if (tramos[tramos.length - 1].length) tramos.push([]);
      }
      for (const t of tramos) if (t.length > 1) trazo(ctx, t, col, met === l.metodo ? 1.9 : 1.1);
      const hh = Math.max(1e-12, l.hAbs);
      const e = Math.abs((met === 'adelante' ? cocienteAdelante(c.f, l.x0, l.h) : cocienteCentrado(c.f, l.x0, l.hAbs)) - l.d1);
      punto(ctx, X(Math.log10(hh)), Y(Math.max(-16, Math.log10(Math.max(1e-17, e)))), col, met === l.metodo ? 3.6 : 2.6);
    }
    ctx.fillStyle = '#64748b'; ctx.font = `500 9px ${f}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('redondeo', m.l + 3, m.t + 1);
    ctx.font = `600 10px ${f}`; ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('h', w - m.r - 2, h - m.b - 2);
  };

  // ── tabla ──
  const limite = cifraTabla(l.d1);
  const filaActiva = H_TABLA.reduce((mejor, h, i) => (Math.abs(Math.log10(h) - Math.log10(l.hAbs)) < Math.abs(Math.log10(H_TABLA[mejor]) - Math.log10(l.hAbs)) ? i : mejor), 0);
  const activa = Math.abs(Math.log10(H_TABLA[filaActiva]) - Math.log10(l.hAbs)) <= 0.5;
  const celda = (val: number) => {
    const s = cifraTabla(val);
    const k = prefijoComun(s, limite);
    return <><span className="text-emerald-300">{s.slice(0, k)}</span><span className="text-slate-400">{s.slice(k)}</span></>;
  };
  const sgn = l.h < 0 ? -1 : 1;
  const tabla = (
    <table className="w-full border-collapse font-mono text-[10.5px] tabular-nums leading-[1.35]" data-tabla-h="">
      <thead>
        <tr className="text-[9.5px] font-semibold tracking-wide text-slate-500">
          <th className="text-left font-semibold">h</th><th className="text-right font-semibold" style={{ color: COL.sec }}>delante</th><th className="text-right font-semibold" style={{ color: COL.infl }}>centrada</th>
        </tr>
      </thead>
      <tbody>
        {H_TABLA.map((h, i) => (
          <tr key={h} className={activa && i === filaActiva ? 'bg-amber-400/10' : ''}>
            <td className="text-left text-slate-400">{sgn < 0 ? '−' : ''}{pot10(Math.round(Math.log10(h)))}</td>
            <td className="text-right">{celda(cocienteAdelante(c.f, l.x0, sgn * h))}</td>
            <td className="text-right">{celda(cocienteCentrado(c.f, l.x0, h))}</td>
          </tr>
        ))}
        <tr className="border-t border-white/10">
          <td className="text-left text-slate-400">lím</td>
          <td colSpan={2} className="text-right font-semibold" style={{ color: COL.tan }}>{limite}</td>
        </tr>
      </tbody>
    </table>
  );

  const lectura = (
    <div className="flex items-baseline justify-between gap-2" data-instrumento="pendiente">
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-slate-400">{reto ? 'v(t) = s′(t)' : 'f′(x₀)'}</div>
        <div className="font-mono text-[20px] font-semibold leading-none tabular-nums" style={{ color: COL.tan }} data-lectura="derivada">
          {num(l.d1, 3)}<span className="ml-1 text-[11px] text-slate-400">{uD.trim()}</span>
        </div>
      </div>
      <div className="text-right font-mono text-[10.5px] leading-tight tabular-nums text-slate-300">
        <div><span className="text-slate-500">h </span>{num(l.h, l.hAbs < 0.01 ? 4 : 3)}</div>
        <div><span style={{ color: COL.sec }}>{reto ? 'Δs/Δt' : 'Δf/h'} </span><span data-lectura="secante">{num(l.d, 4)}</span></div>
      </div>
    </div>
  );

  const detalles = (
    <details className={orientacion === 'fila'
      ? 'group relative text-[11px] text-slate-300 [&[open]>div]:block'
      : 'rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-300'}>
      <summary className="cursor-pointer select-none whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400">{orientacion === 'fila' ? 'Modelo' : 'Modelo y límites'}</summary>
      <div className={orientacion === 'fila' ? 'absolute bottom-full right-0 z-30 mb-2 hidden max-h-[60vh] w-[min(340px,80vw)] overflow-y-auto rounded-lg border border-white/15 bg-[#0b1422]/95 p-2.5 shadow-2xl backdrop-blur' : ''}>
      <ul className="mt-1.5 space-y-1 font-mono text-[10.5px] leading-snug text-slate-200">
        <li>f′(x) = lím h→0 [f(x+h) − f(x)]/h</li>
        <li>delante: error ≈ (h/2)·f″(x) → O(h)</li>
        <li>centrada: [f(x+h) − f(x−h)]/(2h), error ≈ (h²/6)·f‴(x) → O(h²)</li>
        <li>redondeo ≈ ε·|f|/h, ε = 2,2·10⁻¹⁶: h óptimo ≈ √ε y ∛ε</li>
        <li>f′ = 0: punto crítico (máx. si f″ &lt; 0) · f″ cambia de signo: inflexión</li>
        <li>reto: v = s′, a = v′ = s″; llama ∝ (a + g)/g</li>
      </ul>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
      <ul className="mt-1 list-disc space-y-1 pl-4 leading-snug">
        <li>La escena anima h hasta 3·10⁻⁴ del dominio; tabla y gráfico usan doble precisión real hasta 10⁻¹².</li>
        <li>Escalas x e y distintas: el ángulo visible no es atan f′.</li>
        <li>s(t) es telemetría dada; el empuje se supone vertical y sin arrastre; la llama es esquemática.</li>
        <li>Cuentas y grosores no están a escala.</li>
      </ul>
      </div>
    </details>
  );

  const mediciones = reto && r.mediciones.length > 0 && (
    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
      <span>{r.mediciones.length} medición{r.mediciones.length === 1 ? '' : 'es'}</span>
      <button type="button" onClick={() => r.borrarMediciones()} className="flex items-center gap-1 rounded px-1 hover:text-rose-300" aria-label="Borrar las mediciones"><Trash2 size={11} /> borrar</button>
    </div>
  );

  const tituloFD = reto ? 'Posición y velocidad' : 'Función y derivada';
  const tituloTabla = <>Pendiente según <span className="normal-case">h</span></>;

  const ordenTxt = verOrden
    ? <span className="whitespace-nowrap font-mono text-[9.5px] tabular-nums text-slate-400" data-orden="">orden <span style={{ color: COL.sec }}>{oAd == null ? '—' : num(oAd, 2)}</span> · <span style={{ color: COL.infl }}>{oCe == null ? '—' : num(oCe, 2)}</span></span>
    : null;

  if (orientacion === 'columna') {
    // alto de las gráficas: lo que deja el resto, entre 58 y 118 px
    const resto = 66 + 140 + 52 + 34 + 4 * 30 + (reto && r.mediciones.length ? 16 : 0);
    const g = Math.max(58, Math.min(118, Math.floor((alto - resto) / 3)));
    return (
      <div className="flex h-full flex-col gap-2 overflow-y-auto overflow-x-hidden p-2.5 [scrollbar-width:thin]" data-dock="derivada" data-tick={tick}>
        <Seccion titulo="Pendiente">{lectura}</Seccion>
        <Seccion titulo={tituloFD} extra={<span className="font-mono text-[9.5px] text-slate-500">{v} = {num(l.x0, 2)}</span>}>
          <Lienzo alto={g} dibujar={dibujarF} etiqueta="La función con la secante y la tangente en el punto marcado" deps={[tick, revela]} />
          <div className="h-1" />
          <Lienzo alto={g} dibujar={dibujarD} etiqueta="La derivada: la pendiente de la tangente en cada punto" deps={[tick, revela]} />
          {mediciones}
        </Seccion>
        <Seccion titulo={tituloTabla}>{tabla}</Seccion>
        <Seccion titulo="Error del cociente" extra={ordenTxt}>
          <Lienzo alto={g} dibujar={dibujarError} etiqueta="Error del cociente incremental frente a h, en escala logarítmica" deps={[tick, revela]} />
        </Seccion>
        {detalles}
      </div>
    );
  }

  // franja bajo la escena: 3 columnas; en estrecho, la tabla y el error comparten la segunda (pestañas)
  const tres = ancho >= 600;
  const gF = Math.max(40, Math.floor((alto - 44) / 2));
  const gE = Math.max(46, alto - 62);
  const pestanas = (
    <div className="flex rounded-md border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label="Instrumento">
      {(['tabla', 'error'] as const).map((k) => (
        <button key={k} type="button" onClick={() => setVista(k)} aria-pressed={vista === k}
          className={`h-5 rounded px-1.5 text-[10px] font-semibold ${vista === k ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
          {k === 'tabla' ? 'tabla' : 'error'}
        </button>
      ))}
    </div>
  );
  const error = (
    <>
      <Lienzo alto={tres ? gE : Math.max(46, alto - 70)} dibujar={dibujarError} etiqueta="Error del cociente incremental frente a h, en escala logarítmica" deps={[tick, revela]} />
      <div className="mt-1 flex items-center justify-between gap-2">{ordenTxt}{detalles}</div>
    </>
  );
  return (
    <div className={`grid h-full gap-2 overflow-hidden p-2 ${tres ? 'grid-cols-[1fr_1.1fr_1fr]' : 'grid-cols-2'}`} data-dock="derivada" data-tick={tick}>
      <Seccion titulo={ancho >= 480 ? tituloFD : <span className="normal-case">{reto ? 's(t) y v(t)' : 'f y f′'}</span>}
        extra={<span className="whitespace-nowrap font-mono text-[9.5px] text-slate-500">{v} = {num(l.x0, 2)}</span>}>
        <Lienzo alto={gF} dibujar={dibujarF} etiqueta="La función con la secante y la tangente en el punto marcado" deps={[tick, revela]} />
        <div className="h-1" />
        <Lienzo alto={gF} dibujar={dibujarD} etiqueta="La derivada: la pendiente de la tangente en cada punto" deps={[tick, revela]} />
      </Seccion>
      {tres ? (
        <>
          <Seccion titulo={tituloTabla} extra={mediciones || undefined}>{tabla}</Seccion>
          <Seccion titulo="Error del cociente">{error}</Seccion>
        </>
      ) : (
        <Seccion titulo={ancho >= 480 ? (vista === 'tabla' ? tituloTabla : 'Error del cociente')
          : <span className="normal-case">{vista === 'tabla' ? 'h → 0' : 'log–log'}</span>} extra={pestanas}>
          {vista === 'tabla' ? <>{tabla}{mediciones}</> : error}
        </Seccion>
      )}
    </div>
  );
}

