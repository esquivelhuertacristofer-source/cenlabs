'use client';
/**
 * qmi02/Dock.tsx — el dock de instrumentos de la cámara de gas, en DOM nítido (lienzos a
 * devicePixelRatio). Lee el MISMO reloj que la escena (`RelojGas`): cada cuadro que la
 * escena integra sube `version` y el dock se redibuja con ese estado.
 *
 *  - Presión: lo que marca el manómetro y lo que da CONTAR LOS IMPULSOS de las esferas en
 *    las paredes, ΣJ/(A·t), con su error estándar; y la R que sale de esa medida, PV/(nT).
 *  - Rapideces: el histograma de la nube (barras con el color de la escena) sobre la
 *    curva de Maxwell–Boltzmann a la T del termostato, con v_p, ⟨v⟩ y v_rms.
 *  - Diagrama P–V / P–T / V–T: el camino que ha seguido el gas, el punto de ahora, el
 *    objetivo y los puntos que registra el alumno. La ley (isoterma, isocora, isobara)
 *    NO se dibuja hasta que la práctica está validada.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  GASES, masaMolar, maxwellBoltzmann, vProbable, vMedia, vRms, colorRapidez, presionLey, R_ATM, POR_MOL, N_A, DIAMETRO_CHOQUE,
} from './cinetica';
import { N_BINS, type RelojGas } from './reloj';

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
/** 1,5·10²¹ */
export function cientifica(x: number, d = 1): string {
  const e = Math.floor(Math.log10(Math.abs(x)));
  return `${cifra(x / 10 ** e, d)}·10${String(e).split('').map((ch) => SUP[ch] ?? ch).join('')}`;
}

// ───────────────────────────── reloj → React ─────────────────────────────

/** Re-render a ≤ `hz` cuando el reloj integra un cuadro nuevo (o cambia de reloj). */
export function useTickReloj(reloj: React.MutableRefObject<RelojGas>, hz = 30): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimaG = -1, t0 = 0;
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const r = reloj.current;
      if ((r.version !== ultimaV || r.generacion !== ultimaG) && ahora - t0 >= 1000 / hz) {
        ultimaV = r.version; ultimaG = r.generacion; t0 = ahora;
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
  x0: number; x1: number; y0: number; y1: number; xFmt: (v: number) => string; yFmt: (v: number) => string; xLabel: string; yLabel: string;
  nx?: number; ny?: number; yLabelVertical?: boolean;
}): Ejes {
  const m = { l: o.yLabelVertical ? 40 : 30, r: 10, t: 8, b: 22 };
  const X = (v: number) => m.l + ((v - o.x0) / (o.x1 - o.x0)) * (w - m.l - m.r);
  const Y = (v: number) => h - m.b - ((v - o.y0) / (o.y1 - o.y0)) * (h - m.t - m.b);
  const f = familia();
  const xt = marcas(o.x0, o.x1, o.nx ?? 4), yt = marcas(o.y0, o.y1, o.ny ?? (h < 110 ? 2 : 3));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(148,163,184,0.13)';
  for (const t of xt) { ctx.beginPath(); ctx.moveTo(Math.round(X(t)) + 0.5, m.t); ctx.lineTo(Math.round(X(t)) + 0.5, h - m.b); ctx.stroke(); }
  for (const t of yt) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(t)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(t)) + 0.5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 10px ${f}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const t of xt) {
    // la última cifra no se sale del lienzo
    const s = o.xFmt(t), tw = ctx.measureText(s).width;
    ctx.fillText(s, Math.min(w - tw / 2 - 1, X(t)), h - m.b + 4);
  }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of yt) ctx.fillText(o.yFmt(t), m.l - 4, Y(t));
  ctx.font = `600 10px ${f}`;
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText(o.xLabel, w - m.r, h - m.b - 3);
  if (o.yLabelVertical) {
    ctx.save();
    ctx.translate(3, (m.t + h - m.b) / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = `500 9px ${f}`; ctx.fillStyle = '#94a3b8';
    ctx.fillText(o.yLabel, 0, 0);
    ctx.restore();
  } else {
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(o.yLabel, m.l + 4, m.t);
  }
  return { X, Y, m };
}

function trazo(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, ancho: number, rayas: number[] = []) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(rayas); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.setLineDash([]);
}

function punto(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 4, hueco = false) {
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (hueco) { ctx.strokeStyle = color; ctx.fillStyle = '#0b1220'; ctx.fill(); ctx.stroke(); }
  else { ctx.fillStyle = color; ctx.strokeStyle = '#0b1220'; ctx.fill(); ctx.stroke(); }
}

const css = (rgb: [number, number, number], a = 1) => `rgba(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)},${a})`;

const COL_MB = '#e2e8f0', COL_P = '#38bdf8', COL_LEY = '#34d399', COL_OBJ = '#fbbf24', COL_ALUMNO = '#f8fafc';
const ALTO_GRAF_MAX = 250, ALTO_GRAF_MIN = 68;
/** lo que se pliega en un panel muy bajo: el pie de la presión y el de las rapideces, con sus márgenes (px) */
const PIE_RAPIDECES = 36;
const P_MAX = 8, P_ROJA = 7, V_MAX = 16, T_MAX = 1050;

// ───────────────────────────── dock ─────────────────────────────

export type Diagrama = 'PV' | 'PT' | 'VT';

/** Un punto que registró el alumno (se guarda en la bitácora: `gases_logs`). */
export interface RegistroGas { id: string; T: number; V: number; n: number; P: number; Pimp?: number | null; timestamp?: string }

export interface DockGasProps {
  reloj: React.MutableRefObject<RelojGas>;
  pTarget: number;
  /** la práctica está validada: ya se puede dibujar la ley */
  validado: boolean;
  registros: RegistroGas[];
  onRegistrar: () => void;
  onBorrar: () => void;
  pie?: React.ReactNode;
}

export function DockGas({ reloj, pTarget, validado, registros, onRegistrar, onBorrar, pie }: DockGasProps) {
  const tick = useTickReloj(reloj);
  const r = reloj.current;
  const l = r.lectura, M = r.macro;
  const Mkg = masaMolar(M.gas);
  const explotado = M.explotado;
  const R = r.rEmergente();
  const [diag, setDiag] = useState<Diagrama>('PV');

  // ── rapideces: histograma de la nube sobre Maxwell–Boltzmann a la T del termostato ──
  const vp = vProbable(M.T, Mkg), vm = vMedia(M.T, Mkg), vr = vRms(M.T, Mkg);
  const eje = r.ejeV;
  const dibujarRapideces = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const dens = r.densidad();
    const pico = maxwellBoltzmann(vp, M.T, Mkg);
    let dmax = 0; for (let k = 0; k < N_BINS; k++) dmax = Math.max(dmax, dens[k]);
    // eje en «% de las moléculas por cada 100 m/s»
    const esc = 1e4;
    const y1 = Math.max(pico, dmax) * esc * 1.18;
    const { X, Y, m } = ejes(ctx, w, h, {
      x0: 0, x1: eje, y0: 0, y1, xFmt: (v) => cifra(v, 0), yFmt: (v) => cifra(v, y1 < 5 ? 1 : 0),
      xLabel: 'v (m/s)', yLabel: '% por 100 m/s', yLabelVertical: true,
    });
    const dv = eje / N_BINS;
    const rgb: [number, number, number] = [0, 0, 0];
    for (let k = 0; k < N_BINS; k++) {
      const x0 = X(k * dv) + 0.5, x1 = X((k + 1) * dv) - 0.5;
      const y = Y(dens[k] * esc);
      colorRapidez((k + 0.5) * dv, Mkg, rgb);
      ctx.fillStyle = css(rgb, 0.78);
      ctx.fillRect(x0, y, Math.max(1, x1 - x0), h - m.b - y);
    }
    // la curva de la teoría
    const pts: [number, number][] = [];
    for (let i = 0; i <= 120; i++) { const v = (i / 120) * eje; pts.push([X(v), Y(maxwellBoltzmann(v, M.T, Mkg) * esc)]); }
    trazo(ctx, pts, COL_MB, 1.6);
    // v_p, ⟨v⟩, v_rms
    const f = familia();
    ctx.font = `600 10px ${f}`; ctx.textBaseline = 'top';
    // vₚ a la izquierda de su raya y v_rms a la derecha de la suya; ⟨v⟩ (entre las dos) sólo si cabe
    const holgado = X(vr) - X(vp) > 44;
    const marcasV: [number, string, number][] = [[vp, 'vₚ', -1], [vm, '⟨v⟩', 0], [vr, 'v_rms', 1]];
    for (const [v, t, lado] of marcasV) {
      if (v > eje) continue;
      const x = Math.round(X(v)) + 0.5;
      ctx.strokeStyle = 'rgba(226,232,240,0.55)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, Y(y1 * 0.92)); ctx.lineTo(x, h - m.b); ctx.stroke(); ctx.setLineDash([]);
      if (lado === 0 && !holgado) continue;
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = lado < 0 ? 'right' : lado > 0 ? 'left' : 'center';
      ctx.fillText(t, x + lado * 3, lado === 0 ? Y(y1) : Y(y1 * 0.97) + 1);
    }
  };

  // ── diagrama de estados ──
  const tray = r.trayectoria;
  const Vahora = l.V, Pahora = l.P, Tahora = M.T;
  const dibujarDiagrama = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const conf = diag === 'PV'
      ? { x0: 0, x1: V_MAX, y0: 0, y1: P_MAX, xL: 'V (L)', yL: 'P (atm)', fx: (p: { V: number }) => p.V, fy: (p: { P: number }) => p.P }
      : diag === 'PT'
        ? { x0: 0, x1: T_MAX, y0: 0, y1: P_MAX, xL: 'T (K)', yL: 'P (atm)', fx: (p: { T: number }) => p.T, fy: (p: { P: number }) => p.P }
        : { x0: 0, x1: T_MAX, y0: 0, y1: V_MAX, xL: 'T (K)', yL: 'V (L)', fx: (p: { T: number }) => p.T, fy: (p: { V: number }) => p.V };
    const { X, Y, m } = ejes(ctx, w, h, {
      x0: conf.x0, x1: conf.x1, y0: conf.y0, y1: conf.y1, xFmt: (v) => cifra(v, 0), yFmt: (v) => cifra(v, 0), xLabel: conf.xL, yLabel: conf.yL,
      nx: diag === 'PV' ? 4 : 5, ny: h < 110 ? 2 : 4,
    });
    const f = familia();
    // zona roja del manómetro (> 7 atm)
    if (diag !== 'VT') {
      ctx.fillStyle = 'rgba(239,68,68,0.10)';
      ctx.fillRect(m.l + 1, Y(P_MAX), w - m.l - m.r - 1, Y(P_ROJA) - Y(P_MAX));
      // el objetivo del reto
      const yo = Math.round(Y(pTarget)) + 0.5;
      ctx.strokeStyle = COL_OBJ; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(m.l, yo); ctx.lineTo(w - m.r, yo); ctx.stroke(); ctx.setLineDash([]);
      // rótulo a la izquierda, bajo la raya: la esquina de arriba a la derecha es de la ley
      ctx.fillStyle = COL_OBJ; ctx.font = `600 10px ${f}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('objetivo', m.l + 4, yo + 2);
    }
    // la ley, sólo tras validar
    if (validado && !explotado) {
      const n = M.n;
      const pts: [number, number][] = [];
      let rotulo = '';
      if (diag === 'PV') {
        for (let i = 0; i <= 160; i++) { const V = 0.4 + (i / 160) * (V_MAX - 0.4); const P = presionLey(n, Tahora, V); if (P <= P_MAX * 1.05) pts.push([X(V), Y(Math.min(P, P_MAX * 1.05))]); }
        rotulo = `isoterma ${cifra(Tahora, 0)} K`;
      } else if (diag === 'PT') {
        pts.push([X(0), Y(0)], [X(T_MAX), Y(presionLey(n, T_MAX, M.V))]);
        rotulo = `isocora ${cifra(M.V, 1)} L`;
      } else {
        const P = presionLey(n, Tahora, M.V);
        pts.push([X(0), Y(0)], [X(T_MAX), Y((n * R_ATM * T_MAX) / P)]);
        rotulo = `isobara ${cifra(P, 2)} atm`;
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(m.l, m.t, w - m.l - m.r, h - m.t - m.b); ctx.clip();
      trazo(ctx, pts, COL_LEY, 1.6, [6, 4]);
      ctx.restore();
      ctx.fillStyle = COL_LEY; ctx.font = `600 10px ${f}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('PV = nRT', w - m.r - 2, m.t + 2);
      ctx.font = `500 10px ${f}`;
      ctx.fillText(rotulo, w - m.r - 2, m.t + 14);
    }
    // el camino que ha seguido el gas
    const pts = tray.map((p) => [X(conf.fx(p)), Y(Math.min(conf.fy(p), conf.y1))] as [number, number]);
    trazo(ctx, pts, 'rgba(56,189,248,0.45)', 1.4);
    for (const [x, y] of pts.slice(-60)) { ctx.fillStyle = 'rgba(56,189,248,0.55)'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
    // los puntos del alumno
    for (const p of registros) punto(ctx, X(conf.fx(p)), Y(Math.min(conf.fy(p), conf.y1)), COL_ALUMNO, 3.6, true);
    // el punto de ahora
    if (!explotado) {
      const ahora = { V: Vahora, P: Pahora, T: Tahora };
      punto(ctx, X(conf.fx(ahora)), Y(Math.min(conf.fy(ahora), conf.y1)), COL_P, 4.5);
    }
  };

  // el dock cabe sin scroll: las dos gráficas ceden altura si el panel es bajo
  const raiz = useRef<HTMLDivElement>(null);
  const [altoGraf, setAltoGraf] = useState(ALTO_GRAF_MAX);
  const altoActual = useRef(ALTO_GRAF_MAX);
  // si ni así cabe, se pliegan los pies de cifras (T de la muestra y choques; vₚ, ⟨v⟩, v_rms: sus rayas siguen rotuladas)
  const [compacto, setCompacto] = useState(false);
  const compactoActual = useRef(false);
  useLayoutEffect(() => {
    const el = raiz.current, caja = el?.parentElement;
    if (!el || !caja) return;
    const ajustar = () => {
      const cs = getComputedStyle(caja);
      const util = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const dets = Array.from(el.querySelectorAll('details'));
      const abierto = dets.reduce((s, d) => s + (d.open ? d.offsetHeight - (d.querySelector('summary')?.offsetHeight ?? 0) - 12 : 0), 0);
      const resto = el.scrollHeight - abierto - 2 * altoActual.current;
      const conPie = resto + (compactoActual.current ? PIE_RAPIDECES : 0);
      const comp = (util - conPie) / 2 < ALTO_GRAF_MIN;
      const hh = Math.max(ALTO_GRAF_MIN, Math.min(ALTO_GRAF_MAX, Math.floor((util - conPie + (comp ? PIE_RAPIDECES : 0)) / 2)));
      if (comp !== compactoActual.current) { compactoActual.current = comp; setCompacto(comp); }
      if (hh !== altoActual.current) { altoActual.current = hh; setAltoGraf(hh); }
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(caja); ro.observe(el);
    ajustar();
    return () => ro.disconnect();
  }, []);

  const moleculasPorEsfera = (M.n * N_A) / Math.max(1, l.N);
  const gas = GASES[M.gas];

  return (
    <div ref={raiz} className="space-y-1.5" data-dock="gas" data-tick={tick}>
      {/* presión: manómetro y la medida por impulsos */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2" data-instrumento="presion">
        <div className="flex items-end justify-between gap-2">
          <span className="font-mono text-[24px] font-semibold leading-none tabular-nums text-white" data-lectura="P">{cifra(l.P, 2)}<span className="ml-1 text-[13px] text-slate-400">atm</span></span>
          <span className="flex flex-col items-end leading-tight">
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400" title="Lo que marca la aguja del manómetro de Bourdon">Manómetro</span>
            <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{cifra(l.P * 101.325, 0)} kPa</span>
          </span>
        </div>
        <div className="mt-1.5 space-y-0.5 font-mono text-[11px] tabular-nums leading-tight text-slate-300">
          <div className="flex items-baseline justify-between gap-2" data-lectura="impulsos"
            title="Presión de la muestra: la suma de los impulsos 2m·v de cada choque contra las paredes, dividida por área y tiempo (± error estándar)">
            <b className="whitespace-nowrap" style={{ color: COL_P }}>ΣJ/(A·t)</b>
            <span className="whitespace-nowrap text-right">
              {explotado ? '—' : l.Pimp == null ? <span className="text-slate-500">midiendo…</span> : <>{cifra(l.Pimp, 2)}{l.sigma != null && <span className="text-slate-400"> ± {cifra(l.sigma, 2)}</span>} atm</>}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2" data-lectura="R" title="La constante de los gases que sale de la medida por impulsos: P·V/(n·T), en atm·L/(mol·K)">
            <b className="whitespace-nowrap text-emerald-300">PV/nT</b>
            <span className="whitespace-nowrap text-right">{R == null ? '—' : <>{cifra(R.R, 4)}{R.sigma != null && <span className="text-slate-400"> ± {cifra(R.sigma, 4)}</span>}</>}</span>
          </div>
        </div>
        <div className={`mt-1 h-[14px] justify-between gap-2 whitespace-nowrap font-mono text-[10px] leading-[14px] tabular-nums text-slate-400 ${compacto ? 'hidden' : 'flex'}`}>
          <span title="Temperatura de la muestra: M⟨v²⟩/(3R)">T muestra {cifra(l.Tmuestra, 0)} K</span>
          <span title="Choques contra las paredes contados en la medida">{cifra(l.choques, 0)} choques</span>
        </div>
      </section>

      {/* rapideces */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2" data-instrumento="rapideces">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400" title="Histograma de las rapideces de las esferas sobre la distribución de Maxwell–Boltzmann a la T del termostato">Rapideces</span>
          <span className="flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-slate-300" title="Curva: Maxwell–Boltzmann a la temperatura del termostato">
            <i className="block h-[2px] w-3 bg-slate-200" /> Maxwell–Boltzmann
          </span>
        </div>
        <Lienzo alto={altoGraf} dibujar={dibujarRapideces} etiqueta="Histograma de rapideces de las moléculas sobre la curva de Maxwell–Boltzmann" deps={[tick]} />
        <div className={`mt-1 h-[14px] justify-between font-mono text-[10px] leading-[14px] tabular-nums text-slate-400 ${compacto ? 'hidden' : 'flex'}`}>
          <span>vₚ {cifra(vp, 0)}</span><span>⟨v⟩ {cifra(vm, 0)}</span><span>v_rms {cifra(vr, 0)} m/s</span>
        </div>
      </section>

      {/* diagrama de estados */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2" data-instrumento="diagrama">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
          <div className="flex rounded-md border border-white/10 bg-black/20 p-0.5" role="tablist" aria-label="Diagrama">
            {(['PV', 'PT', 'VT'] as const).map((d) => (
              <button key={d} type="button" role="tab" aria-selected={diag === d} onClick={() => setDiag(d)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${diag === d ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'}`}>
                {d[0]}–{d[1]}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={onRegistrar} disabled={explotado} title="Guardar este estado (T, V, n, P) en la bitácora y marcarlo en el diagrama"
              className="flex h-6 items-center gap-1 rounded-md border border-white/15 bg-white/5 px-1.5 text-[10px] font-semibold text-slate-200 hover:border-cyan-400/50 disabled:opacity-40" data-registrar="">
              <Plus size={11} /> Registrar
            </button>
            {registros.length > 0 && (
              <button type="button" onClick={onBorrar} aria-label="Borrar los puntos registrados" title="Borrar los puntos registrados"
                className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-slate-400 hover:text-red-300"><Trash2 size={11} /></button>
            )}
          </div>
        </div>
        <Lienzo alto={altoGraf} dibujar={dibujarDiagrama} etiqueta="Diagrama de estados del gas con su trayectoria, el punto actual y los puntos registrados" deps={[tick, diag, validado, registros, pTarget]} />
      </section>

      <details className="group rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-slate-300">
        <summary className="flex cursor-pointer select-none items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 [&::-webkit-details-marker]:hidden">
          <span className="whitespace-nowrap"><span className="inline-block transition-transform group-open:rotate-90">▸</span> Modelo y límites</span>
          <span className="truncate font-mono normal-case tracking-normal text-slate-500" data-leyenda-q2=""
            title={`Esferas de ${gas.formula} en la cámara; cada una representa ${cientifica(moleculasPorEsfera)} moléculas reales`}>
            {cifra(l.N, 0)} esferas · 1 ≈ {cientifica(moleculasPorEsfera)}
          </span>
        </summary>
        <ul className="mt-1.5 space-y-1 font-mono text-[11px] leading-snug text-slate-200">
          <li>f(v) = 4π v² (M/2πRT)^(3/2) · e^(−Mv²/2RT)</li>
          <li>vₚ = √(2RT/M) · ⟨v⟩ = √(8RT/πM) · v_rms = √(3RT/M)</li>
          <li>P = ΣJ/(A·t), J = 2m·vₙ en cada choque</li>
          <li>P = N·m⟨v²⟩/(3V) = nRT/V</li>
          <li>choque: v₁′ = v₁ − (g·ê)ê, v₂′ = v₂ + (g·ê)ê</li>
          <li>color: T = M v²/(3R), de 40 K (azul) a 2500 K (rojo)</li>
        </ul>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 leading-snug">
          <li>Gas ideal: el manómetro marca nRT/V. La muestra son {POR_MOL} esferas por mol (superpartículas) de {cifra(DIAMETRO_CHOQUE * 100, 1)} mm de diámetro de choque; su volumen propio sube la P por impulsos un 0,3 % a 300 K y 10 L, y hasta ~6 % al borde de 7 atm a 100 K.</li>
          <li>Paredes térmicas (fondo y cuarzo): la esfera sale con la T del termostato. El pistón es especular.</li>
          <li>Sin gravedad. El pistón se mueve a tiempo real; las moléculas, a cámara lenta: la compresión es cuasiestática.</li>
          <li>El gas inyectado entra a 20 °C; la placa se ve al rojo sólo por encima de ~ 850 K (Planck) y escarcha bajo 0 °C.</li>
        </ul>
      </details>

      {pie}
    </div>
  );
}
