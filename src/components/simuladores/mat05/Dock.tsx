'use client';
/**
 * mat05/Dock.tsx — el dock de instrumentos del círculo trigonométrico, en DOM nítido
 * (lienzos a devicePixelRatio, tipografía del lab). Es una BANDA bajo la escena, no un
 * panel lateral: así el lienzo queda apaisado (el instrumento es ancho) y nada se
 * superpone a la escena en 1366×768 ni en el móvil. Lee el MISMO reloj que la escena.
 *
 *  - Proyecciones: sen θ, cos θ y tan θ (con su ojo para mostrarlas en la escena), la
 *    identidad sen²θ + cos²θ = 1 como barra partida, el cuadrante y el ángulo de referencia.
 *  - Onda: sen, cos y tan frente a θ con el cursor del reloj y las capturas del alumno.
 *  - Tras validar: la recta y = v del reto con sus dos soluciones y la tabla de notables.
 *  - Fourier: la serie, S_N(θ), el error cuadrático (Parseval), el sobreimpulso (Gibbs),
 *    el espectro |b_k| y la onda objetivo con la suma parcial.
 *
 * NO REGALAR. Antes de validar no hay recta del reto, ni soluciones, ni tabla de valores
 * exactos (daría el ángulo de referencia de la ecuación): sólo lo que el alumno mide.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import {
  leer, aRad, radianesExactos, NOTABLES, sumaParcial, ondaObjetivo, terminos, errorRMS, maximoSuma, potencia,
  coeficiente, GIBBS, FORMULA_SERIE, NOMBRE_FORMA, type Forma,
} from './trigonometria';
import { type RelojTrig, N_MAX } from './reloj';
import type { RevelacionM5 } from './Trigonometria3DScene';

// ───────────────────────────── formato ─────────────────────────────

const MENOS = '−';
/** Cifra con `d` decimales, coma decimal y signo menos tipográfico. */
export function cifra(x: number, d = 4, signo = false): string {
  if (!Number.isFinite(x)) return x > 0 ? '+∞' : x < 0 ? '−∞' : '—';
  const abs = Math.abs(x).toFixed(d);
  const cero = Number(abs) === 0;
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + abs.replace('.', ',');
}
/** Ángulo para leer: «210° · 7π/6 rad» o «37° · 0,646 rad». */
export function textoAngulo(g: number): { grados: string; rad: string } {
  const gr = Math.abs(g - Math.round(g)) < 1e-6 ? String(Math.round(g) % 360) : cifra(g, 1);
  const ex = radianesExactos(g);
  return { grados: `${gr}°`, rad: ex ?? cifra(aRad(g), 3) };
}

export const COL = { sen: '#38bdf8', cos: '#e879f9', tan: '#facc15', fourier: '#fb923c', captura: '#fbbf24' };

// ───────────────────────────── reloj → React ─────────────────────────────

/** Re-render a ≤ `hz` cuando el reloj cambia de versión. */
export function useTickReloj(reloj: React.MutableRefObject<RelojTrig>, hz = 30): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, t0 = 0;
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const v = reloj.current.version;
      if (v !== ultimaV && ahora - t0 >= 1000 / hz) { ultimaV = v; t0 = ahora; setTick((n) => n + 1); }
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, [reloj, hz]);
  return tick;
}

// ───────────────────────────── lienzos ─────────────────────────────

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');

function Lienzo({ alto, dibujar, deps, etiqueta }: {
  alto: number; dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; deps: unknown[]; etiqueta: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [ancho, setAncho] = useState(0);
  // una sola clave de tamaño fijo: el mismo lienzo pasa de la onda (7 deps) a Fourier (3)
  const clave = deps.map((d) => String(d)).join('|');
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
  }, [ancho, alto, clave]);
  return (
    <div ref={caja} className="w-full">
      <canvas ref={lienzo} role="img" aria-label={etiqueta} style={{ width: '100%', height: alto, display: 'block' }} />
    </div>
  );
}

function trazo(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, ancho: number, rayas: number[] = []) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(rayas); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.setLineDash([]);
}
function punto(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 3.6) {
  ctx.fillStyle = color; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

/** Ejes θ ∈ [0°, 360°] × y ∈ [−Y, Y] con bandas de cuadrante. */
function ejesOnda(ctx: CanvasRenderingContext2D, w: number, h: number, Y: number) {
  const m = { l: 24, r: 8, t: 12, b: 16 };
  const X = (g: number) => m.l + (g / 360) * (w - m.l - m.r);
  const Yp = (v: number) => m.t + ((Y - v) / (2 * Y)) * (h - m.t - m.b);
  const f = familia();
  // bandas II y IV muy tenues + número del cuadrante
  ctx.fillStyle = 'rgba(148,163,184,0.045)';
  ctx.fillRect(X(90), m.t, X(180) - X(90), h - m.t - m.b);
  ctx.fillRect(X(270), m.t, X(360) - X(270), h - m.t - m.b);
  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = `600 9px ${f}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ['I', 'II', 'III', 'IV'].forEach((q, i) => ctx.fillText(q, X(45 + 90 * i), 1));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(148,163,184,0.14)';
  for (const g of [90, 180, 270]) { ctx.beginPath(); ctx.moveTo(Math.round(X(g)) + 0.5, m.t); ctx.lineTo(Math.round(X(g)) + 0.5, h - m.b); ctx.stroke(); }
  for (const v of [-1, 1]) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Yp(v)) + 0.5); ctx.lineTo(w - m.r, Math.round(Yp(v)) + 0.5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.beginPath(); ctx.moveTo(m.l, Math.round(Yp(0)) + 0.5); ctx.lineTo(w - m.r, Math.round(Yp(0)) + 0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = `500 9.5px ${f}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const g of [0, 90, 180, 270, 360]) ctx.fillText(`${g}°`, Math.min(w - m.r - 10, Math.max(m.l + 4, X(g))), h - m.b + 3);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of [-1, 0, 1]) ctx.fillText(v < 0 ? '−1' : String(v), m.l - 4, Yp(v));
  return { X, Y: Yp, m };
}

// ───────────────────────────── dock ─────────────────────────────

export interface DockTrigProps {
  reloj: React.MutableRefObject<RelojTrig>;
  modo: 'circulo' | 'fourier';
  verSeno: boolean;
  verCoseno: boolean;
  verTangente: boolean;
  onToggle: (f: 'sen' | 'cos' | 'tan') => void;
  capturados: number[];
  revelado: RevelacionM5 | null;
  /** alto disponible para la banda (px): las gráficas se ajustan */
  alto: number;
  /** ancho del contenedor (px): decide 1, 2 o 3 columnas */
  ancho: number;
}

const ALTO_CABECERA = 22;

/** La serie en notación compacta (la completa va en el title). */
const FORMULA_CORTA: Record<Forma, string> = {
  cuadrada: '(4/π) Σ sen kθ / k, k impar',
  triangular: '(8/π²) Σ (−1)ʲ sen kθ / k², k = 2j+1',
  sierra: '(2/π) Σ (−1)ᵏ⁺¹ sen kθ / k',
};

export function DockTrig({ reloj, modo, verSeno, verCoseno, verTangente, onToggle, capturados, revelado, alto, ancho }: DockTrigProps) {
  const tick = useTickReloj(reloj);
  const r = reloj.current;
  const th = r.theta;
  const l = leer(th);
  const ang = textoAngulo(th);
  const estrecho = ancho < 520;
  const ancho3 = ancho >= 900;
  const [pestana, setPestana] = useState<'onda' | 'extra'>('onda');
  const extraDisponible = modo === 'fourier' || !!revelado;
  const verExtraEnB = !ancho3 && pestana === 'extra' && extraDisponible;
  useEffect(() => { if (!extraDisponible) setPestana('onda'); }, [extraDisponible]);
  // en estrecho las proyecciones van en una fila encima de la gráfica (≈ 48 px)
  const altoGraf = Math.max(54, alto - ALTO_CABECERA - 16 - (estrecho ? 56 : 0));

  // ── la onda (círculo) ──
  const dibujarOnda = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const Y = verTangente ? 1.6 : 1.25;
    const { X, Y: Yp, m } = ejesOnda(ctx, w, h, Y);
    const curva = (f: (g: number) => number | null, color: string, ancho2: number) => {
      ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t - 2, w - m.l - m.r, h - m.t - m.b + 4); ctx.clip();
      let tramo: [number, number][] = [];
      for (let i = 0; i <= 360; i++) {
        const v = f(i);
        if (v == null || Math.abs(v) > Y * 1.6) { trazo(ctx, tramo, color, ancho2); tramo = []; continue; }
        tramo.push([X(i), Yp(v)]);
      }
      trazo(ctx, tramo, color, ancho2);
      ctx.restore();
    };
    if (verTangente) curva((g) => leer(g).tan, COL.tan, 1.4);
    if (verCoseno) curva((g) => Math.cos(aRad(g)), COL.cos, 1.8);
    if (verSeno) curva((g) => Math.sin(aRad(g)), COL.sen, 2);
    // capturas del alumno
    for (const g of capturados) {
      ctx.strokeStyle = 'rgba(251,191,36,0.45)'; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(X(g), m.t); ctx.lineTo(X(g), h - m.b); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.captura;
      ctx.beginPath(); ctx.moveTo(X(g) - 4, m.t - 6); ctx.lineTo(X(g) + 4, m.t - 6); ctx.lineTo(X(g), m.t); ctx.closePath(); ctx.fill();
    }
    // el reto, sólo tras validar
    if (revelado) {
      trazo(ctx, [[m.l, Yp(revelado.valor)], [w - m.r, Yp(revelado.valor)]], 'rgba(251,191,36,0.85)', 1.3, [5, 3]);
      for (const s of revelado.soluciones) {
        ctx.strokeStyle = COL.captura; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(s), Yp(revelado.valor), 6, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // cursor del reloj
    ctx.strokeStyle = 'rgba(241,245,249,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(Math.round(X(th)) + 0.5, m.t); ctx.lineTo(Math.round(X(th)) + 0.5, h - m.b); ctx.stroke();
    if (verTangente && l.tan != null && Math.abs(l.tan) <= Y) punto(ctx, X(th), Yp(l.tan), COL.tan, 3);
    if (verCoseno) punto(ctx, X(th), Yp(l.cos), COL.cos);
    if (verSeno) punto(ctx, X(th), Yp(l.sen), COL.sen);
  };

  // ── Fourier: objetivo y suma parcial ──
  const ts = r.terminos;
  const dibujarFourier = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const Y = 1.35;
    const { X, Y: Yp, m } = ejesOnda(ctx, w, h, Y);
    const obj: [number, number][] = [], sn: [number, number][] = [];
    for (let i = 0; i <= 720; i++) {
      const g = i / 2, t = aRad(g);
      obj.push([X(g), Yp(ondaObjetivo(r.forma, t + (i === 720 ? -1e-9 : i === 0 ? 1e-9 : 0)))]);
      sn.push([X(g), Yp(sumaParcial(ts, t))]);
    }
    trazo(ctx, obj, 'rgba(226,232,240,0.55)', 1.2, [4, 3]);
    trazo(ctx, sn, COL.fourier, 2);
    ctx.strokeStyle = 'rgba(241,245,249,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(Math.round(X(th)) + 0.5, m.t); ctx.lineTo(Math.round(X(th)) + 0.5, h - m.b); ctx.stroke();
    punto(ctx, X(th), Yp(sumaParcial(ts, aRad(th))), COL.fourier);
  };

  // ── Fourier: espectro |b_k| ──
  const kMax = r.forma === 'sierra' ? N_MAX : 2 * N_MAX - 1;
  const dibujarEspectro = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = { l: 22, r: 6, t: 8, b: 15 };
    const f = familia();
    const bMax = 4 / Math.PI;
    const X = (k: number) => m.l + ((k - 0.5) / kMax) * (w - m.l - m.r);
    const Yp = (v: number) => h - m.b - (v / bMax) * (h - m.t - m.b);
    ctx.strokeStyle = 'rgba(148,163,184,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.l, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
    const bw = Math.max(2, ((w - m.l - m.r) / kMax) * 0.62);
    const incluidos = new Set(ts.map((t) => t.k));
    for (let k = 1; k <= kMax; k++) {
      const b = Math.abs(coeficiente(r.forma, k));
      if (b === 0) continue;
      ctx.fillStyle = incluidos.has(k) ? COL.fourier : 'rgba(148,163,184,0.28)';
      ctx.fillRect(X(k) - bw / 2, Yp(b), bw, h - m.b - Yp(b));
    }
    ctx.fillStyle = '#94a3b8'; ctx.font = `500 9.5px ${f}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const k of [1, 5, 10, 15, 19].filter((k) => k <= kMax)) ctx.fillText(String(k), X(k), h - m.b + 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#cbd5e1'; ctx.font = `600 9.5px ${f}`;
    ctx.fillText('|bₖ|', m.l + 2, 0);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('k', w - m.r, h - m.b - 2);
  };

  const Pestanas = () => (!ancho3 && extraDisponible ? (
    <div className="flex rounded-md border border-white/10 bg-white/[0.04] p-0.5" role="tablist">
      {(['onda', 'extra'] as const).map((p) => (
        <button key={p} type="button" role="tab" aria-selected={pestana === p} onClick={() => setPestana(p)}
          className={`h-5 rounded px-1.5 text-[10px] font-semibold ${pestana === p ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
          {p === 'onda' ? 'Onda' : modo === 'fourier' ? 'Espectro' : 'Notables'}
        </button>
      ))}
    </div>
  ) : !ancho3 && modo === 'circulo' ? (
    <span className="flex items-center gap-1 text-[10px] text-slate-500" title="La tabla de valores exactos se abre al validar"><Lock size={10} /> Notables</span>
  ) : null);

  const Notables = ({ altoT }: { altoT: number }) => (
    <table className="w-full border-collapse font-mono text-[11px] tabular-nums text-slate-200" style={{ maxHeight: altoT }} data-notables="">
      <thead>
        <tr className="text-[10px] text-slate-400"><th className="text-left font-semibold">θ</th><th className="font-semibold" style={{ color: COL.sen }}>sen</th><th className="font-semibold" style={{ color: COL.cos }}>cos</th><th className="font-semibold" style={{ color: COL.tan }}>tan</th></tr>
      </thead>
      <tbody>
        {NOTABLES.map((n) => (
          <tr key={n.g} className={revelado && revelado.soluciones.some((s) => leer(s).referencia === n.g) ? 'text-amber-200' : ''}>
            <td className="text-left">{n.g}°</td><td className="text-center">{n.sen}</td><td className="text-center">{n.cos}</td><td className="text-center">{n.tan}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // ── panel A: proyecciones (círculo) o serie (Fourier) ──
  const fila = (f: 'sen' | 'cos' | 'tan', activa: boolean, valor: string) => (
    <div className="flex items-center justify-between gap-2" key={f}>
      <button type="button" onClick={() => onToggle(f)} aria-pressed={activa} title={activa ? 'Ocultar en la escena' : 'Mostrar en la escena'}
        className={`flex items-center gap-1 rounded px-0.5 text-[11px] font-semibold ${activa ? '' : 'opacity-50 hover:opacity-80'}`} style={{ color: COL[f] }}>
        {activa ? <Eye size={12} /> : <EyeOff size={12} />} {f} θ
      </button>
      <span className="font-mono text-[14px] font-semibold tabular-nums text-white" data-lectura={f}>{valor}</span>
    </div>
  );
  const tanTxt = l.tan == null ? '∞' : Math.abs(l.tan) > 9999 ? (l.tan > 0 ? '+∞' : '−∞') : cifra(l.tan, 4);
  const signo = (s: -1 | 0 | 1 | null) => (s == null ? '∄' : s > 0 ? '+' : s < 0 ? '−' : '0');
  // corto a propósito: «Cuad. III · − − +» y «ref 88,4°» caben en una línea de la columna de 200 px
  const cuadranteTxt = l.cuadrante === 0 ? 'Sobre eje' : `Cuad. ${['', 'I', 'II', 'III', 'IV'][l.cuadrante]}`;

  const s2 = l.sen * l.sen, c2 = l.cos * l.cos;
  const panelA = modo === 'circulo' ? (
    <section className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5" data-instrumento="proyecciones">
      <div className="mb-1 flex items-center justify-between gap-2" style={{ height: ALTO_CABECERA - 6 }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Proyecciones</span>
        <span className="font-mono text-[11px] tabular-nums text-slate-200" data-lectura="theta">{ang.grados} · {ang.rad}</span>
      </div>
      {estrecho ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {fila('sen', verSeno, cifra(l.sen))}{fila('cos', verCoseno, cifra(l.cos))}{fila('tan', verTangente, tanTxt)}
        </div>
      ) : (
        <div className="space-y-0.5">
          {fila('sen', verSeno, cifra(l.sen))}
          {fila('cos', verCoseno, cifra(l.cos))}
          {fila('tan', verTangente, tanTxt)}
          {/* identidad pitagórica: la barra se reparte entre sen² y cos² y siempre suma 1 */}
          <div className="flex items-center gap-1.5 pt-0.5" title="sen²θ + cos²θ = 1 (Pitágoras en el círculo de radio 1)">
            <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
              <i className="block h-full" style={{ width: `${s2 * 100}%`, background: COL.sen }} />
              <i className="block h-full" style={{ width: `${c2 * 100}%`, background: COL.cos }} />
            </div>
            <span className="whitespace-nowrap font-mono text-[10px] tabular-nums text-slate-300" data-lectura="pitagoras">sen²+cos² = {cifra(l.pitagoras, 4)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] tabular-nums text-slate-400" data-lectura="cuadrante">
            <span className="whitespace-nowrap" title="Cuadrante y signos de sen, cos y tan">{cuadranteTxt} · <span style={{ color: COL.sen }}>{signo(l.signos.sen)}</span> <span style={{ color: COL.cos }}>{signo(l.signos.cos)}</span> <span style={{ color: COL.tan }}>{signo(l.signos.tan)}</span></span>
            <span className="whitespace-nowrap" title="Ángulo de referencia: el agudo entre el radio y el eje x">ref {cifra(l.referencia, Number.isInteger(l.referencia) ? 0 : 1)}°</span>
          </div>
        </div>
      )}
    </section>
  ) : (
    <section className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5" data-instrumento="serie">
      <div className="mb-1 flex items-center justify-between gap-2" style={{ height: ALTO_CABECERA - 6 }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Serie · {NOMBRE_FORMA[r.forma]}</span>
        <span className="font-mono text-[11px] tabular-nums text-slate-200">{ang.grados}</span>
      </div>
      <div className="font-mono text-[10px] leading-snug text-slate-300" title={`f(θ) = ${FORMULA_SERIE[r.forma]}`} data-lectura="formula">f = {FORMULA_CORTA[r.forma]}</div>
      <div className={`mt-0.5 grid gap-x-3 font-mono text-[11px] tabular-nums text-slate-200 ${estrecho ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="flex justify-between"><span className="text-slate-400">N</span><span>{ts.length} armónicos (k ≤ {ts[ts.length - 1]?.k ?? 0})</span></div>
        <div className="flex justify-between"><span className="text-slate-400">S_N(θ)</span><span style={{ color: COL.fourier }} data-lectura="suma">{cifra(sumaParcial(ts, aRad(th)), 4)}</span></div>
        <div className="flex justify-between" title="Error cuadrático medio frente a la onda (exacto, por Parseval)"><span className="text-slate-400">error rms</span><span>{cifra((100 * errorRMS(r.forma, ts.length)) / Math.sqrt(potencia(r.forma)), 1)} %</span></div>
        <div className="flex justify-between" title={`Máximo de la suma parcial. En los saltos no baja de ${cifra(GIBBS, 3)} (Gibbs)`}><span className="text-slate-400">máx S_N</span><span>{cifra(maximoSuma(r.forma, ts.length, 1440), 3)}</span></div>
      </div>
    </section>
  );

  const tituloB = verExtraEnB ? (modo === 'fourier' ? 'Espectro' : 'Notables') : modo === 'fourier' ? 'Onda · objetivo y suma' : 'Onda';
  const panelB = (
    <section className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5" data-instrumento="onda">
      <div className="mb-1 flex items-center justify-between gap-2" style={{ height: ALTO_CABECERA - 6 }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{tituloB}</span>
        <Pestanas />
      </div>
      {verExtraEnB ? (
        modo === 'fourier'
          ? <Lienzo alto={altoGraf} dibujar={dibujarEspectro} etiqueta="Espectro de la serie: amplitud de cada armónico" deps={[tick, r.forma, ts.length]} />
          : <div style={{ height: altoGraf }} className="overflow-hidden"><Notables altoT={altoGraf} /></div>
      ) : modo === 'fourier' ? (
        <Lienzo alto={altoGraf} dibujar={dibujarFourier} etiqueta="Onda objetivo y suma parcial de Fourier frente al ángulo" deps={[tick, r.forma, ts.length]} />
      ) : (
        <Lienzo alto={altoGraf} dibujar={dibujarOnda} etiqueta="Seno, coseno y tangente frente al ángulo, con el cursor del punto" deps={[tick, verSeno, verCoseno, verTangente, capturados.join(','), revelado?.valor, revelado?.funcion]} />
      )}
    </section>
  );

  const panelC = ancho3 ? (
    modo === 'fourier' ? (
      <section className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5" data-instrumento="espectro">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400" style={{ height: ALTO_CABECERA - 6 }}>Espectro</div>
        <Lienzo alto={altoGraf} dibujar={dibujarEspectro} etiqueta="Espectro de la serie: amplitud de cada armónico" deps={[tick, r.forma, ts.length]} />
      </section>
    ) : (
      <section className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5" data-instrumento="notables">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400" style={{ height: ALTO_CABECERA - 6 }}>
          <span>Notables</span>{!revelado && <span className="flex items-center gap-1 normal-case tracking-normal text-slate-500"><Lock size={10} /> al validar</span>}
        </div>
        {revelado ? <div style={{ height: altoGraf }} className="overflow-hidden"><Notables altoT={altoGraf} /></div> : (
          <div className="grid flex-1 grid-cols-5 gap-1 font-mono text-[11px] text-slate-500" aria-label="Tabla bloqueada hasta validar">
            {NOTABLES.map((n) => <div key={n.g} className="flex flex-col items-center justify-center rounded border border-dashed border-white/10">{n.g}°<span>?</span></div>)}
          </div>
        )}
      </section>
    )
  ) : null;

  const columnas = estrecho ? '1fr' : ancho3 ? '210px minmax(0,1fr) 220px' : '200px minmax(0,1fr)';
  return (
    <div className="grid shrink-0 gap-2 border-t border-white/10 bg-[#0b1220] px-2 py-1.5" style={{ gridTemplateColumns: columnas }} data-dock="trig" data-tick={tick}>
      {panelA}
      {panelB}
      {panelC}
    </div>
  );
}

/** Altura que la banda del dock pide para un contenedor de `ancho`×`alto` px. */
export function altoDock(ancho: number, alto: number): number {
  if (ancho < 520) return Math.round(Math.min(150, Math.max(122, alto * 0.24)));
  return Math.round(Math.min(168, Math.max(124, alto * 0.21)));
}

export { terminos };
