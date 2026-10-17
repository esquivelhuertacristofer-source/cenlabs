'use client';
/**
 * qmi09/Dock.tsx — el dock de instrumentos de la celda galvánica, en DOM nítido
 * (lienzos a devicePixelRatio, tipografía del lab). Lee el MISMO reloj que la escena
 * (`RelojCelda`): cada vez que la escena integra un cuadro sube `version` y el dock se
 * redibuja con ese estado, así que cifras, curvas y escena coinciden.
 *
 *  - Voltímetro: V en bornes (con signo, COM → +), fem E, corriente I y R interna.
 *  - Descarga: E, V e I frente a la carga que ha pasado (la curva de una pila real:
 *    meseta y caída final cuando el reactivo limitante se acaba).
 *  - Nernst: E frente a log Q, con la recta E = E° − (2,303RT/nF)·log Q y K marcada:
 *    el punto de la celda corre por la recta hasta E = 0 en Q = K.
 *  - Faraday: carga, masas disuelta y depositada, concentraciones, ΔG = −nFE y tiempo.
 *
 * NO REGALAR. En el reto, antes de validar, nada dice qué vaso es el ánodo: las masas
 * van por vaso (izq./der.), el cociente Q no se escribe con sus especies y la leyenda
 * no asigna papeles. Lo que sí se ve es lo que mediría un alumno en el banco.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BANCO, METAL, FARADAY, R_GAS, duracion, masaFaraday, VOLUMEN_VARILLA_CM3, type IdMetal } from './electroquimica';
import { COLOR_ION } from './iones';
import type { RelojCelda } from './reloj';

// ───────────────────────────── formato (coma decimal, espacio fino de millares) ─────────────────────────────

const MENOS = '−';
/** Cifra con `d` decimales, coma decimal y espacio fino (U+202F) en los millares (≥ 10 000). */
export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const [ent0, dec] = abs.split('.');
  const ent = ent0.length > 4 ? ent0.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ent0;
  const cuerpo = dec ? `${ent},${dec}` : ent;
  const cero = Number(abs) === 0;
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + cuerpo;
}
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
/** Concentración legible: 0,734 M o 4·10⁻³⁸ M cuando ya casi no queda. */
export function concentracion(c: number): string {
  if (!(c > 0)) return '0 M';
  if (c >= 0.01) return `${cifra(c, 3)} M`;
  const e = Math.floor(Math.log10(c));
  const m = c / 10 ** e;
  return `${cifra(m, 1)}·10${String(e).split('').map((ch) => SUP[ch] ?? ch).join('')} M`;
}
/** Exponente en superíndice (10⁶) para los rótulos de la cámara rápida. */
export const potencia10 = (f: number) => `10${String(Math.round(Math.log10(f))).split('').map((ch) => SUP[ch] ?? ch).join('')}`;

// ───────────────────────────── reloj → React ─────────────────────────────

/** Re-render a ≤ `hz` cuando el reloj integra un cuadro nuevo (o cambia de reloj). */
export function useTickReloj(reloj: React.MutableRefObject<RelojCelda>, hz = 30): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimoR: RelojCelda | null = null, t0 = 0;
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
    const c = lienzo.current; if (!c || ancho < 10) return;
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

/** Marcas «redondas» (1, 2, 5 × 10ⁿ) entre a y b. */
function marcas(a: number, b: number, n = 4): number[] {
  const paso0 = (b - a) / n;
  const p = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 5, 10].map((k) => k * p).find((s) => s >= paso0) ?? 10 * p;
  const out: number[] = [];
  for (let v = Math.ceil(a / paso) * paso; v <= b + 1e-9; v += paso) out.push(Math.abs(v) < 1e-12 ? 0 : v);
  return out;
}

interface Ejes { X: (v: number) => number; Y: (v: number) => number; m: { l: number; r: number; t: number; b: number } }

function ejes(ctx: CanvasRenderingContext2D, w: number, h: number, o: {
  x0: number; x1: number; y0: number; y1: number; xFmt: (v: number) => string; yFmt: (v: number) => string; xLabel: string; yLabel: string; derecha?: number;
}): Ejes {
  const m = { l: 32, r: o.derecha ?? 8, t: 8, b: 22 };
  const X = (v: number) => m.l + ((v - o.x0) / (o.x1 - o.x0)) * (w - m.l - m.r);
  const Y = (v: number) => h - m.b - ((v - o.y0) / (o.y1 - o.y0)) * (h - m.t - m.b);
  const f = familia();
  const xt = marcas(o.x0, o.x1, 4), yt = marcas(o.y0, o.y1, 3);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(148,163,184,0.13)';
  for (const t of xt) { ctx.beginPath(); ctx.moveTo(Math.round(X(t)) + 0.5, m.t); ctx.lineTo(Math.round(X(t)) + 0.5, h - m.b); ctx.stroke(); }
  for (const t of yt) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(t)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(t)) + 0.5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 10px ${f}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const t of xt) ctx.fillText(o.xFmt(t), X(t), h - m.b + 4);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of yt) ctx.fillText(o.yFmt(t), m.l - 4, Y(t));
  ctx.font = `600 10px ${f}`;
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText(o.xLabel, w - m.r, h - m.b - 3);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(o.yLabel, m.l + 4, m.t);
  return { X, Y, m };
}

function trazo(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, ancho: number, rayas: number[] = []) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(rayas); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.setLineDash([]);
}

function punto(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 4) {
  ctx.fillStyle = color; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

const COL_E = '#fbbf24', COL_V = '#38bdf8', COL_I = '#c084fc';
const ALTO_GRAF_MAX = 150, ALTO_GRAF_MIN = 72;

// ───────────────────────────── dock ─────────────────────────────

export interface DockCeldaProps {
  reloj: React.MutableRefObject<RelojCelda>;
  /** ¿se pueden nombrar ánodo y cátodo? (exploración, o reto ya validado) */
  revela: boolean;
  /** contenido extra al final (panel del docente) */
  pie?: React.ReactNode;
}

export function DockCelda({ reloj, revela, pie }: DockCeldaProps) {
  const tick = useTickReloj(reloj);
  const r = reloj.current;
  const l = r.lectura, e = r.estado, m = r.montaje;
  const izq = m.izq, der = m.der;
  const hayPar = !!izq && !!der && izq !== der;
  const T = m.T;
  const slope = l.n > 0 ? (Math.LN10 * R_GAS * T) / (l.n * FARADAY) : 0;   // V por década de Q
  const anodo = l.anodo;
  const nombreLado = (lado: 'izq' | 'der') => {
    const met = lado === 'izq' ? izq : der;
    if (!met) return lado === 'izq' ? 'Vaso izq.' : 'Vaso der.';
    if (revela && anodo) return `${met} ${anodo === lado ? 'ánodo' : 'cátodo'}`;
    return `${met} vaso ${lado === 'izq' ? 'izq.' : 'der.'}`;
  };
  // Δm de cada varilla (g): el volumen sumergido frente al inicial, por su densidad
  const dm = (lado: 'izq' | 'der') => {
    const met = lado === 'izq' ? izq : der; if (!met) return 0;
    return ((lado === 'izq' ? e.vIzq : e.vDer) - VOLUMEN_VARILLA_CM3) * METAL[met].rho;
  };
  const qAbs = Math.abs(e.q);
  const hist = r.historia;

  // ── descarga: E, V e I frente a q ──
  const qMaxK = Math.max(1e-3, r.qMax / 1000);
  const E0abs = hist.length ? Math.max(...hist.slice(0, 4).map((p) => p.E), Math.abs(l.fem)) : Math.abs(l.fem);
  const yMaxE = Math.max(0.5, Math.ceil((E0abs * 1.12) * 4) / 4);
  const I0 = Math.max(1e-9, ...hist.map((p) => p.I), Math.abs(l.I));
  const dibujarDescarga = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { X, Y, m: mg } = ejes(ctx, w, h, {
      x0: 0, x1: qMaxK, y0: 0, y1: yMaxE, xFmt: (v) => cifra(v, v < 10 && qMaxK < 20 ? 1 : 0), yFmt: (v) => cifra(v, yMaxE <= 2 ? 1 : 0),
      xLabel: 'q (kC)', yLabel: 'V', derecha: 30,
    });
    if (!hayPar) return;
    // corriente en el eje derecho (mA)
    const ImA = I0 * 1000;
    const YI = (i: number) => h - mg.b - (i / (ImA * 1.12)) * (h - mg.t - mg.b);
    ctx.fillStyle = COL_I; ctx.font = `500 10px ${familia()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(cifra(ImA, ImA < 10 ? 1 : 0), w - mg.r + 3, YI(ImA));
    ctx.fillText('0', w - mg.r + 3, YI(0));
    ctx.textBaseline = 'top'; ctx.fillText('mA', w - mg.r + 3, YI(0) + 6);
    const pts = hist.length ? hist : [{ q: qAbs, E: Math.abs(l.fem), V: Math.abs(l.V), I: Math.abs(l.I) }];
    trazo(ctx, pts.map((p) => [X(p.q / 1000), YI(p.I * 1000)]), COL_I, 1.3, [3, 3]);
    trazo(ctx, pts.map((p) => [X(p.q / 1000), Y(p.E)]), COL_E, 2);
    trazo(ctx, pts.map((p) => [X(p.q / 1000), Y(p.V)]), COL_V, 2);
    const xq = X(qAbs / 1000);
    punto(ctx, xq, Y(Math.abs(l.fem)), COL_E, 3.5);
    punto(ctx, xq, Y(Math.abs(l.V)), COL_V, 3.5);
  };

  // ── Nernst: E frente a log Q ──
  const log10K = l.lnK / Math.LN10, logQ = l.lnQ / Math.LN10;
  const logQ0 = hist.length ? hist[0].lnQ / Math.LN10 : logQ;
  const xa = Math.floor(Math.min(0, logQ0) - 3), xb = Math.ceil(Math.max(log10K + 4, 6));
  const yN1 = Math.max(0.5, Math.ceil((l.E0 + slope * Math.max(0, -xa)) * 1.1 * 4) / 4);
  const yN0 = -Math.max(0.15, yN1 * 0.14);
  const dibujarNernst = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { X, Y } = ejes(ctx, w, h, {
      x0: xa, x1: xb, y0: yN0, y1: yN1, xFmt: (v) => cifra(v, 0), yFmt: (v) => cifra(v, yN1 <= 2 ? 1 : 0), xLabel: 'log Q', yLabel: 'E (V)',
    });
    if (!hayPar || l.n === 0) return;
    // E = 0
    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(X(xa), Y(0)); ctx.lineTo(X(xb), Y(0)); ctx.stroke(); ctx.setLineDash([]);
    // K
    if (log10K < xb) {
      ctx.strokeStyle = 'rgba(52,211,153,0.6)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(log10K), Y(yN0)); ctx.lineTo(X(log10K), Y(yN1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#6ee7b7'; ctx.font = `700 10px ${familia()}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('K', X(log10K) - 3, Y(yN1) + 12);
    }
    // la recta de Nernst a la T del banco
    trazo(ctx, [[X(xa), Y(l.E0 - slope * xa)], [X(xb), Y(l.E0 - slope * xb)]], 'rgba(226,232,240,0.55)', 1.2);
    // la historia de la celda y el punto de ahora
    trazo(ctx, hist.map((p) => [X(p.lnQ / Math.LN10), Y(p.E)]), COL_E, 2.2);
    punto(ctx, X(Math.min(xb, logQ)), Y(Math.abs(l.fem)), COL_E);
  };

  // el dock cabe sin scroll: las dos gráficas ceden altura si el panel es bajo
  const raiz = useRef<HTMLDivElement>(null);
  const [altoGraf, setAltoGraf] = useState(ALTO_GRAF_MAX);
  const altoActual = useRef(ALTO_GRAF_MAX);
  useLayoutEffect(() => {
    const el = raiz.current, caja = el?.parentElement;
    if (!el || !caja) return;
    const ajustar = () => {
      const cs = getComputedStyle(caja);
      const util = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const dets = Array.from(el.querySelectorAll('details'));
      const abierto = dets.reduce((s, d) => s + (d.open ? d.offsetHeight - (d.querySelector('summary')?.offsetHeight ?? 0) - 12 : 0), 0);
      const resto = el.scrollHeight - abierto - 2 * altoActual.current;
      const hh = Math.max(ALTO_GRAF_MIN, Math.min(ALTO_GRAF_MAX, Math.floor((util - resto) / 2)));
      if (hh !== altoActual.current) { altoActual.current = hh; setAltoGraf(hh); }
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(caja); ro.observe(el);
    ajustar();
    return () => ro.disconnect();
  }, []);

  const sinCircuito = !l.cerrado;
  const especies: { k: keyof typeof COLOR_ION; t: string }[] = [];
  if (izq) especies.push({ k: izq, t: METAL[izq].ion });
  if (der && der !== izq) especies.push({ k: der, t: METAL[der].ion });
  especies.push({ k: 'K', t: 'K⁺' }, { k: 'NO3', t: 'NO₃⁻' }, { k: 'e', t: 'e⁻' });
  // cociente con sus especies: sólo cuando se puede nombrar el ánodo
  const textoQ = revela && hayPar && anodo
    ? (() => {
      const a = (anodo === 'izq' ? izq : der)!, c = (anodo === 'izq' ? der : izq)!;
      const nuA = l.n / METAL[a].z, nuC = l.n / METAL[c].z;
      const pot = (nu: number) => (nu === 1 ? '' : nu === 2 ? '²' : String(nu));
      return `Q = [${METAL[a].ion}]${pot(nuA)}/[${METAL[c].ion}]${pot(nuC)}`;
    })()
    : 'Q de la reacción';

  return (
    <div ref={raiz} className="space-y-2" data-dock="celda" data-tick={tick}>
      {/* voltímetro */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5" data-instrumento="voltimetro">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400" title="Tensión en bornes: punta + (roja) menos COM (negra)">Voltímetro</span>
          <span className="whitespace-nowrap font-mono text-[10px] text-slate-500" title="Resistencia interna: puente salino + disoluciones">{sinCircuito ? 'circuito abierto' : `R int ${cifra(l.Rint, 0)} Ω`}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2 font-mono tabular-nums">
          <span className="text-[24px] font-semibold leading-none text-white" data-lectura="V">{cifra(l.V, 3, true)}<span className="ml-1 text-[13px] text-slate-400">V</span></span>
          <span className="text-right text-[11px] leading-tight text-slate-300">
            <span className="block"><b style={{ color: COL_E }}>E</b> {cifra(l.fem, 3, true)} V</span>
            <span className="block"><b style={{ color: COL_I }}>I</b> {cifra(Math.abs(l.I) * 1000, 2)} mA</span>
          </span>
        </div>
      </section>

      {/* descarga */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Descarga</span>
          <span className="flex gap-2 text-[10px] font-semibold"><span style={{ color: COL_E }}>E</span><span style={{ color: COL_V }}>V</span><span style={{ color: COL_I }}>I</span></span>
        </div>
        <Lienzo alto={altoGraf} dibujar={dibujarDescarga} etiqueta="Fem, tensión en bornes y corriente frente a la carga que ha pasado" deps={[tick, revela]} />
      </section>

      {/* Nernst */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nernst</span>
          <span className="truncate font-mono text-[10px] text-slate-400" data-cociente="" title={revela ? textoQ : 'Cociente de reacción de la reacción espontánea (se muestra al validar)'}>{textoQ}</span>
        </div>
        <Lienzo alto={altoGraf} dibujar={dibujarNernst} etiqueta="Fem de la celda frente al logaritmo del cociente de reacción" deps={[tick, revela]} />
        <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-slate-400">
          <span>log Q {cifra(Math.min(logQ, 999), 1)}</span>
          <span>log K {hayPar ? cifra(log10K, 1) : '—'}</span>
        </div>
      </section>

      {/* Faraday */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 font-mono text-[11px] tabular-nums text-slate-200" data-instrumento="faraday">
        <div className="mb-1 flex items-center justify-between gap-2 font-sans">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Faraday</span>
          <span className="text-[10px] text-slate-400">t {duracion(e.t)}</span>
        </div>
        <div className="flex justify-between"><span className="text-slate-400">q</span><span>{cifra(qAbs, 0)} C · {cifra(qAbs / 3600, 2)} A·h</span></div>
        <div className="mt-0.5 grid grid-cols-[1fr_auto_auto] gap-x-2">
          <span />
          <span className="text-right text-[10px] text-slate-500">Δm (g)</span>
          <span className="text-right text-[10px] text-slate-500">c (M)</span>
          {(['izq', 'der'] as const).map((lado) => {
            const met = lado === 'izq' ? izq : der;
            const c = lado === 'izq' ? l.cIzq : l.cDer;
            return (
              <React.Fragment key={lado}>
                <span className="truncate text-slate-400" data-vaso={lado}>{nombreLado(lado)}</span>
                <span className="text-right">{met ? cifra(dm(lado), 2, true) : '—'}</span>
                <span className="text-right">{met ? concentracion(c).replace(' M', '') : ''}</span>
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex justify-between"><span className="text-slate-400">ΔG = −nFE</span><span>{hayPar ? `${cifra(-l.n * FARADAY * Math.abs(l.fem) / 1000, 1)} kJ/mol` : '—'}</span></div>
      </section>

      {/* leyenda de colores */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-0.5 text-[10px] font-semibold text-slate-300" aria-label="Colores de las especies">
        {especies.map((s) => (
          <span key={s.k} className="flex items-center gap-1">
            <i className="block h-2 w-2 rounded-full" style={{ background: COLOR_ION[s.k], boxShadow: `0 0 6px ${COLOR_ION[s.k]}` }} />{s.t}
          </span>
        ))}
        <span className="text-slate-500">· 1 esfera ≈ 4 mmol</span>
      </div>

      <details className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-300">
        <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-slate-400">Modelo y límites</summary>
        <ul className="mt-1.5 space-y-1 font-mono text-[11px] leading-snug text-slate-200">
          <li>E = E°(T) + (RT/zF)·ln[Mᶻ⁺] (cada semicelda)</li>
          <li>E = E° − (RT/nF)·ln Q · K = e^(nFE°/RT)</li>
          <li>ΔG = −nFE · m = q·M/(zF)</li>
          <li>I = E/(R_ext + R_int) · V = I·R_ext</li>
          <li>R_puente = ℓ/(κA) = {cifra(BANCO.largoPuenteCm, 1)} cm / (κ·{cifra(Math.PI * BANCO.diamPuenteCm ** 2 / 4, 2)} cm²)</li>
          <li>v(e⁻) = I/(n·e·A) · v(ion) = t·I/(zFcA)</li>
          <li>color: T = 10^(−ε·c·ℓ) por canal (Beer–Lambert)</li>
        </ul>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 leading-snug">
          <li>Actividades = concentraciones (sin coeficientes de actividad) y E° de la tabla del reto.</li>
          <li>Sin sobrepotenciales ni polarización: la caída es sólo óhmica.</li>
          <li>La varilla se gasta o recubre por igual en toda su superficie mojada.</li>
          <li>Puente de KNO₃ (el KCl precipitaría AgCl con la plata); su resistencia no cambia al descargarse.</li>
          <li>Cada esfera son {cifra(4, 0)} mmol; la agitación de los iones es esquemática. Cámara rápida con su factor.</li>
          <li>{`m(Cu) de 1 A·h = ${cifra(masaFaraday('Cu' as IdMetal, 3600), 3)} g.`}</li>
        </ul>
      </details>

      {pie}
    </div>
  );
}
