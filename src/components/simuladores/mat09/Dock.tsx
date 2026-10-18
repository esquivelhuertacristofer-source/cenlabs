'use client';
/**
 * mat09/Dock.tsx — el dock de instrumentos del banco de integración, en DOM nítido (lienzos a
 * devicePixelRatio, tipografía del lab). Lee el MISMO reloj que la escena (`RelojRiemann`): cada
 * cuadro que la escena integra sube `version` y el dock se redibuja con ese estado.
 *
 *  - Suma: Sₙ de la regla (durante el llenado, lo vertido en la probeta), n y Δx; en la
 *    exploración, la integral exacta, el error E = S − I, el error relativo y lo que sobra y falta.
 *  - Error frente a n, en log–log: una recta por regla con su orden MEDIDO (pendiente por mínimos
 *    cuadrados de n = 16 a 1024): 1, 1, 2, 2 y 4.
 *  - Suma frente a n: cómo se acerca Sₙ a la integral.
 *
 * NO REGALAR. En el reto, antes de validar: ni la integral exacta, ni el error verdadero, ni la
 * curva Sₙ completa (sólo las sumas que el alumno ha visitado). Si escribe SU integral (Barrow), el
 * dock calcula el error con ese valor: es su cuenta, no la del lab.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  barridoError, ordenMedido, suma, num, numSigno, cientifica, leerDecimal, sobraFalta, columnas, nEfectivo, pot10,
  METODOS, METODOS_RETO, NOMBRE_METODO, COLOR_METODO, CURVA_RETO, type Metodo,
} from './riemann';
import { TOLERANCIA_M9, N_MIN_M9, N_MAX_M9, type MetodoM9 } from '@/domain/matematicas';
import type { RelojRiemann } from './reloj';

// ───────────────────────────── reloj → React ─────────────────────────────

/** Re-render a ≤ `hz` cuando el reloj integra un cuadro nuevo (o cambia de reloj). */
export function useTickReloj(reloj: React.MutableRefObject<RelojRiemann>, hz = 20): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimoR: RelojRiemann | null = null, t0 = 0;
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

/**
 * Lienzo que ocupa el hueco que le deja su tarjeta (ancho Y alto medidos: así nunca se corta por abajo,
 * con pestañas o sin ellas) y dibuja a devicePixelRatio.
 */
function Lienzo({ dibujar, deps, etiqueta }: {
  dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; deps: unknown[]; etiqueta: string;
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
  const { w: ancho, h: alto } = tam;
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
    <div ref={caja} className="relative min-h-[46px] w-full flex-1">
      <canvas ref={lienzo} role="img" aria-label={etiqueta} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}

const COL = { eje: 'rgba(148,163,184,0.45)', rej: 'rgba(148,163,184,0.12)', txt: '#94a3b8', exacta: '#ffd27a', meta: '#f472b6' };

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
    <section className={`flex min-h-0 min-w-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] p-2 ${className}`}>
      <div className="mb-1 flex min-h-[14px] items-center justify-between gap-2">
        <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">{titulo}</span>
        {extra}
      </div>
      {children}
    </section>
  );
}

// ───────────────────────────── dock ─────────────────────────────

export interface MedicionReto { n: number; s: number; metodo: MetodoM9 }

export interface DockProps {
  reloj: React.MutableRefObject<RelojRiemann>;
  /** ¿se pueden mostrar la integral y el error verdadero? (exploración, o reto ya validado) */
  revela: boolean;
  /** ancho de la franja: decide 3 tarjetas o 2 con pestañas (el alto lo mide cada lienzo) */
  ancho: number;
  /** reto: lo que el alumno escribe como integral exacta (texto, con coma) */
  iAlumno: string;
  setIAlumno: (t: string) => void;
  metodoReto: MetodoM9;
  /** reto: las sumas que el alumno ha visitado */
  mediciones: MedicionReto[];
  /** reto validado: el menor n que cumple */
  nMinimo: number | null;
}

export function DockRiemann({ reloj, revela, ancho, iAlumno, setIAlumno, metodoReto, mediciones, nMinimo }: DockProps) {
  const tick = useTickReloj(reloj);
  const [vista, setVista] = useState<'error' | 'suma'>('error');
  const r = reloj.current;
  const c = r.curva, l = r.lectura();
  const reto = r.modo === 'reto';
  const color = COLOR_METODO[l.metodo];
  const metodos: Metodo[] = reto ? METODOS_RETO : METODOS; // constantes del módulo: referencia estable
  const tol = TOLERANCIA_M9[metodoReto];
  const iA = leerDecimal(iAlumno);
  const iValida = Number.isFinite(iA) && iA > 0;
  const eAlumno = iValida ? Math.abs(l.suma - iA) / iA : NaN;

  // ── error frente a n (log–log) ──
  const nTope = reto ? 128 : 1024;
  const yRango: [number, number] = reto ? [-6, 2] : [-10, 2];
  // lo que sólo depende de la curva (se calcula una vez por curva, no en cada cuadro)
  const barridos = useMemo(() => metodos.map((mt) => ({ mt, pts: barridoError(c, mt) })), [c, metodos]);
  const ordenesTodas = useMemo(() => metodos.map((mt) => ({ m: mt, p: ordenMedido(c, mt) })), [c, metodos]);
  const sumasN = useMemo(() => {
    const out = new Map<Metodo, { n: number; s: number }[]>();
    const nMax = reto ? N_MAX_M9 : 256;
    for (const mt of metodos) {
      const pts: { n: number; s: number }[] = [];
      for (let n = reto ? N_MIN_M9 : 1; n <= nMax; n++) if (nEfectivo(n, mt) === n) pts.push({ n, s: suma(c, n, mt) });
      out.set(mt, pts);
    }
    return out;
  }, [c, metodos, reto]);
  const ordenes = !reto || revela ? ordenesTodas : [];
  const dibujarError = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = { l: 34, r: 8, t: 6, b: 16 };
    const lx1 = Math.log2(nTope);
    const X = (n: number) => m.l + (Math.log2(n) / lx1) * (w - m.l - m.r);
    const Y = (e: number) => h - m.b - ((Math.log10(e) - yRango[0]) / (yRango[1] - yRango[0])) * (h - m.t - m.b);
    const f = familia();
    ctx.lineWidth = 1; ctx.strokeStyle = COL.rej;
    for (let k = 0; k <= lx1; k += 2) { ctx.beginPath(); ctx.moveTo(Math.round(X(2 ** k)) + 0.5, m.t); ctx.lineTo(Math.round(X(2 ** k)) + 0.5, h - m.b); ctx.stroke(); }
    const pasoY = yRango[1] - yRango[0] > 8 ? 4 : 2;
    for (let k = yRango[0]; k <= yRango[1]; k += pasoY) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(10 ** k)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(10 ** k)) + 0.5); ctx.stroke(); }
    ctx.strokeStyle = COL.eje;
    ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
    ctx.fillStyle = COL.txt; ctx.font = `500 9px ${f}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let k = 0; k <= lx1; k += 2) ctx.fillText(String(2 ** k), X(2 ** k), h - m.b + 3);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let k = yRango[0]; k <= yRango[1]; k += pasoY) ctx.fillText(pot10(k), m.l - 3, Y(10 ** k));
    ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t, w - m.l - m.r, h - m.t - m.b); ctx.clip();
    if (!reto || revela) {
      // una recta por regla (la elegida, más gruesa)
      for (const { mt, pts: bp } of barridos) {
        const pts = bp.filter((p) => p.n <= nTope).map((p) => [X(p.n), Y(Math.max(1e-13, p.e))] as [number, number]);
        trazo(ctx, pts, mt === l.metodo ? COLOR_METODO[mt] : `${COLOR_METODO[mt]}88`, mt === l.metodo ? 2 : 1.1);
      }
      if (reto) {
        // la meta del reto (error relativo < tol) en error absoluto, y el n mínimo
        ctx.strokeStyle = COL.meta; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
        const ym = Y(tol * c.exacta);
        ctx.beginPath(); ctx.moveTo(m.l, ym); ctx.lineTo(w - m.r, ym); ctx.stroke(); ctx.setLineDash([]);
        if (nMinimo) { ctx.strokeStyle = 'rgba(244,114,182,0.6)'; ctx.beginPath(); ctx.moveTo(X(nMinimo), m.t); ctx.lineTo(X(nMinimo), h - m.b); ctx.stroke(); }
      }
    } else if (iValida) {
      // reto sin validar: el error con la integral DEL ALUMNO, y su meta
      const pts: [number, number][] = [];
      for (const p of sumasN.get(l.metodo) ?? []) { const e = Math.abs(p.s - iA); if (e > 0) pts.push([X(p.n), Y(Math.max(1e-13, e))]); }
      trazo(ctx, pts, color, 1.8);
      ctx.strokeStyle = COL.meta; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
      const ym = Y(tol * iA);
      ctx.beginPath(); ctx.moveTo(m.l, ym); ctx.lineTo(w - m.r, ym); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    // el punto de ahora
    const eAhora = !reto || revela ? Math.abs(l.error) : iValida ? Math.abs(l.suma - iA) : NaN;
    if (Number.isFinite(eAhora) && eAhora > 1e-13 && l.n <= nTope) punto(ctx, X(l.n), Y(eAhora), color, 3.8);
    if (reto && !revela && !iValida) {
      ctx.fillStyle = '#64748b'; ctx.font = `500 10px ${f}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('escribe tu ∫ para ver tu error', (m.l + w - m.r) / 2, (m.t + h - m.b) / 2);
    }
    ctx.font = `600 10px ${f}`; ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('n', w - m.r - 2, h - m.b - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('|E|', m.l + 4, m.t);
  };

  // ── suma frente a n ──
  const dibujarSuma = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = { l: 34, r: 8, t: 6, b: 16 };
    const nMax = reto ? 128 : 256;
    const lx1 = Math.log2(nMax);
    const ver = !reto || revela;
    const propia = ver ? sumasN.get(l.metodo) ?? [] : [];
    // rango vertical: las sumas que se dibujan (y la integral si se puede ver)
    let lo = Infinity, hi = -Infinity;
    const incluir = (s: number) => { lo = Math.min(lo, s); hi = Math.max(hi, s); };
    if (ver) { for (const p of propia) if (p.n >= 2) incluir(p.s); incluir(c.exacta); }
    else { for (const md of mediciones) if (md.metodo === l.metodo) incluir(md.s); incluir(l.suma); }
    if (!(hi > lo)) { lo = l.suma - 1; hi = l.suma + 1; }
    const aire = (hi - lo) * 0.12;
    lo -= aire; hi += aire;
    const X = (n: number) => m.l + (Math.log2(n) / lx1) * (w - m.l - m.r);
    const Y = (s: number) => h - m.b - ((s - lo) / (hi - lo)) * (h - m.t - m.b);
    const f = familia();
    ctx.lineWidth = 1; ctx.strokeStyle = COL.rej;
    for (let k = 0; k <= lx1; k += 2) { ctx.beginPath(); ctx.moveTo(Math.round(X(2 ** k)) + 0.5, m.t); ctx.lineTo(Math.round(X(2 ** k)) + 0.5, h - m.b); ctx.stroke(); }
    ctx.strokeStyle = COL.eje;
    ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
    ctx.fillStyle = COL.txt; ctx.font = `500 9px ${f}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let k = 0; k <= lx1; k += 2) ctx.fillText(String(2 ** k), X(2 ** k), h - m.b + 3);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const dec = hi - lo < 2 ? 2 : hi - lo < 20 ? 1 : 0;
    for (const s of [lo + aire, hi - aire]) ctx.fillText(num(s, dec), m.l - 3, Y(s));
    ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t, w - m.l - m.r, h - m.t - m.b); ctx.clip();
    if (ver) {
      if (reto) {
        // banda de la tolerancia del método del reto alrededor de la integral
        ctx.fillStyle = 'rgba(244,114,182,0.10)';
        ctx.fillRect(m.l, Y(c.exacta * (1 + tol)), w - m.l - m.r, Y(c.exacta * (1 - tol)) - Y(c.exacta * (1 + tol)));
      }
      ctx.strokeStyle = COL.exacta; ctx.setLineDash([5, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(c.exacta)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(c.exacta)) + 0.5); ctx.stroke(); ctx.setLineDash([]);
      trazo(ctx, propia.map((p) => [X(p.n), Y(p.s)] as [number, number]), color, 1.8);
      if (reto && nMinimo) { ctx.strokeStyle = 'rgba(244,114,182,0.6)'; ctx.beginPath(); ctx.moveTo(X(nMinimo), m.t); ctx.lineTo(X(nMinimo), h - m.b); ctx.stroke(); }
    }
    if (reto) for (const md of mediciones) if (md.metodo === l.metodo) punto(ctx, X(md.n), Y(md.s), `${COLOR_METODO[md.metodo]}aa`, 2.4);
    ctx.restore();
    punto(ctx, X(l.n), Y(l.suma), color, 3.8);
    ctx.font = `600 10px ${f}`; ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('n', w - m.r - 2, h - m.b - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('S', m.l + 4, m.t);
    ctx.font = `600 8px ${f}`; ctx.fillText('n', m.l + 11, m.t + 5);
    if (ver) { ctx.fillStyle = COL.exacta; ctx.textAlign = 'right'; ctx.fillText('∫', w - m.r - 4, Math.max(m.t, Y(c.exacta) - 13)); }
  };

  // ── lectura ──
  const sf = !reto || revela ? sobraFalta(c, columnas(c, l.n, l.metodo), 16) : null;
  const lectura = (
    <div className="flex h-full flex-col gap-1" data-instrumento="suma">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-slate-400">S<sub className="text-[8px]">n</sub> · {NOMBRE_METODO[l.metodo].toLowerCase()}</div>
          <div className={`font-mono font-semibold leading-none tabular-nums ${ancho >= 600 ? 'text-[21px]' : 'text-[17px]'}`} style={{ color }} data-lectura="suma">{num(l.sumaMostrada, 4)}</div>
        </div>
        <div className="shrink-0 whitespace-nowrap text-right font-mono text-[10.5px] leading-tight tabular-nums text-slate-300">
          <div><span className="text-slate-500">n </span><span data-lectura="n">{l.n}</span></div>
          <div><span className="text-slate-500">Δx </span>{num(l.h, l.h < 0.1 ? 4 : 3)}</div>
        </div>
      </div>
      {(!reto || revela) ? (
        <div className={`grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 whitespace-nowrap font-mono tabular-nums leading-tight ${ancho >= 600 ? 'text-[10.5px]' : 'text-[9.5px]'}`} data-lectura="error">
          <span className="text-slate-500">∫ exacta</span><span className="text-right" style={{ color: COL.exacta }}>{num(c.exacta, 4)}</span>
          <span className="text-slate-500">E = S − ∫</span><span className="text-right text-slate-200">{Math.abs(l.error) < 1e-12 * c.exacta ? '0 (exacta)' : numSigno(l.error, Math.abs(l.error) < 0.01 ? 6 : 4)}</span>
          <span className="text-slate-500">|E| / ∫</span><span className="text-right text-slate-200">{Math.abs(l.error) < 1e-12 * c.exacta ? '0 %' : `${cientifica(l.errorRel * 100, 2)} %`}</span>
          {sf && (ancho >= 600 ? <>
            <span className="text-slate-500">sobra · falta</span>
            <span className="text-right"><span style={{ color: '#ff6b85' }}>{num(sf.sobra, 3)}</span><span className="text-slate-500"> · </span><span style={{ color: '#5fe6ff' }}>{num(sf.falta, 3)}</span></span>
          </> : <>
            {/* estrecho: en dos filas, que en una no caben */}
            <span className="text-slate-500">sobra</span><span className="text-right" style={{ color: '#ff6b85' }}>{num(sf.sobra, 3)}</span>
            <span className="text-slate-500">falta</span><span className="text-right" style={{ color: '#5fe6ff' }}>{num(sf.falta, 3)}</span>
          </>)}
          {reto && nMinimo && <><span className="text-slate-500">n mínimo</span><span className="text-right" style={{ color: COL.meta }}>{nMinimo}</span></>}
        </div>
      ) : (
        <div className="flex flex-col gap-1" data-lectura="reto">
          <label className="flex items-center justify-between gap-2 text-[10.5px] text-slate-400">
            <span>Tu ∫ exacta</span>
            <input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={iAlumno} placeholder="Barrow"
              onChange={(e) => setIAlumno(e.target.value.replace(/[^0-9,.\-−]/g, '').slice(0, 12))}
              aria-label="Tu valor de la integral exacta (con coma decimal)"
              className="h-6 w-[92px] rounded border border-white/15 bg-[#0b1422] px-1.5 text-right font-mono text-[11.5px] text-white outline-none focus:border-[#219EBC]" data-campo-integral="" />
          </label>
          <div className="flex items-center justify-between font-mono text-[10.5px] tabular-nums">
            <span className="text-slate-500">error con tu ∫</span>
            <span className={iValida ? (eAlumno < tol ? 'text-emerald-300' : 'text-rose-300') : 'text-slate-500'} data-lectura="error-alumno">
              {iValida ? `${num(eAlumno * 100, 3)} %` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10.5px] tabular-nums">
            <span className="text-slate-500">meta</span><span style={{ color: COL.meta }}>&lt; {num(tol * 100, 1)} % · {NOMBRE_METODO[metodoReto].toLowerCase()}</span>
          </div>
        </div>
      )}
    </div>
  );

  const ordenTxt = ordenes.length ? (
    <span className="flex flex-wrap items-center justify-end gap-x-1.5 font-mono text-[9.5px] tabular-nums" data-orden="">
      {(ancho >= 700 ? ordenes : ordenes.filter((o) => o.m === l.metodo)).map((o) => (
        <span key={o.m} style={{ color: COLOR_METODO[o.m], opacity: o.m === l.metodo ? 1 : 0.75 }} title={`orden medido · ${NOMBRE_METODO[o.m]}`}>
          {ancho >= 700 ? '' : 'orden '}{o.p === null ? 'exacta' : num(o.p, 2)}
        </span>
      ))}
    </span>
  ) : <span className="font-mono text-[9.5px] text-slate-500">{reto && !revela ? 'con tu ∫' : ''}</span>;

  const detalles = (
    <details className="group relative text-[11px] text-slate-300 [&[open]>div]:block">
      <summary className="cursor-pointer select-none whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400">Modelo</summary>
      <div className="absolute bottom-full right-0 z-30 mb-2 hidden max-h-[60vh] w-[min(360px,80vw)] overflow-y-auto rounded-lg border border-white/15 bg-[#0b1422]/95 p-2.5 shadow-2xl backdrop-blur">
        <ul className="space-y-1 font-mono text-[10.5px] leading-snug text-slate-200">
          <li>Δx = (b − a)/n · xᵢ = a + i·Δx</li>
          <li>izquierda Δx·Σf(xᵢ) · derecha Δx·Σf(xᵢ₊₁) · E ≈ ∓(Δx/2)[f(b) − f(a)]</li>
          <li>punto medio Δx·Σf(xᵢ + Δx/2) · E ≈ −(Δx²/24)[f′(b) − f′(a)]</li>
          <li>trapecios Δx·[f₀/2 + f₁ + … + fₙ/2] · E ≈ (Δx²/12)[f′(b) − f′(a)]</li>
          <li>Simpson (Δx/3)[f₀ + 4f₁ + 2f₂ + … + fₙ] · E ≈ (Δx⁴/180)[f‴(b) − f‴(a)]</li>
          <li>orden = pendiente de log|E| frente a log Δx (mínimos cuadrados, n = 16 … 1024)</li>
        </ul>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 leading-snug">
          <li>La probeta tiene su propia escala (unidades de área): no está a la escala de la placa.</li>
          <li>Las columnas llevan un hueco fino entre ellas para verse; el área se calcula sin hueco.</li>
          <li>Simpson necesita n par: un n impar se sube al par siguiente.</li>
        </ul>
      </div>
    </details>
  );

  // franja bajo la escena: 3 columnas; en estrecho, error y suma comparten la segunda (pestañas)
  const tres = ancho >= 600;
  const pestanas = (
    <div className="flex rounded-md border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label="Instrumento">
      {(['error', 'suma'] as const).map((k) => (
        <button key={k} type="button" onClick={() => setVista(k)} aria-pressed={vista === k}
          className={`h-5 rounded px-1.5 text-[10px] font-semibold ${vista === k ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
          {k === 'error' ? 'error' : 'suma'}
        </button>
      ))}
    </div>
  );
  const lienzoError = <Lienzo dibujar={dibujarError} etiqueta="Error de la suma frente a n, en escala logarítmica" deps={[tick, revela, iAlumno, nMinimo, ancho]} />;
  const lienzoSuma = <Lienzo dibujar={dibujarSuma} etiqueta="La suma de Riemann frente a n" deps={[tick, revela, mediciones.length, nMinimo, ancho]} />;
  return (
    <div className={`grid h-full gap-2 overflow-hidden p-2 ${tres ? 'grid-cols-[minmax(190px,0.9fr)_1.2fr_1fr]' : 'grid-cols-[minmax(150px,1fr)_1.25fr]'}`} data-dock="riemann" data-tick={tick}>
      <Seccion titulo={tres ? 'Suma de Riemann' : 'Riemann'} extra={detalles}>{lectura}</Seccion>
      {tres ? (
        <>
          <Seccion titulo="Error frente a n" extra={ordenTxt}>{lienzoError}</Seccion>
          <Seccion titulo="Suma frente a n">{lienzoSuma}</Seccion>
        </>
      ) : (
        <Seccion titulo={vista === 'error' ? 'log–log' : 'Suma'} extra={pestanas}>{vista === 'error' ? lienzoError : lienzoSuma}</Seccion>
      )}
    </div>
  );
}

export { CURVA_RETO };
