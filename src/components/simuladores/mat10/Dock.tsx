'use client';
/**
 * mat10/Dock.tsx — el dock de la máquina de Galton, en DOM nítido (lienzo a
 * devicePixelRatio, tipografía del lab). Lee lo MISMO que la escena en este cuadro:
 * las cuentas del store (que la escena escribe en el cuadro en que cada bolita se
 * posa) y la inclinación y la última bolita que publica en el banco (reloj único).
 *
 *  - Histograma de la muestra (barras = bolitas de cada canal).
 *  - «Tu curva teórica»: la normal N(μ̂, σ̂²)·N con la predicción que el alumno ESCRIBE
 *    (son sus números, no los del modelo).
 *  - La binomial del modelo (N·P(k), puntos) y su normal N(np, np(1 − p)) sólo
 *    aparecen tras VALIDAR; antes no hay nada dibujado de lo que salga μ ni σ.
 *  - x̄ y s muestrales; tras validar, μ, σ y la prueba χ² con su p-valor.
 *  - El camino de la última bolita: sus diez decisiones y el canal en que cayó.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { estadisticaMuestraM10, chiCuadradaM10, leerNumero, MUESTRA_MIN_M10 } from '@/domain/matematicas';
import { useBancoGalton } from './banco';
import { CONTENEDORES, CAPACIDAD, FILAS, densidadNormal, pmfBinomial, pValorChi2, W_IMPACTO, DY_FILA, R_VIAL } from './galton';

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');
const COL = {
  barra: '#9fb4c8', barraBorde: '#d8e3ee', pred: '#fbbf24', binom: '#f8fafc', normal: '#fb7185',
};

/** Lienzo que se ajusta al ancho de su contenedor y dibuja a devicePixelRatio. */
export function Lienzo({ alto, dibujar, deps, etiqueta }: {
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
    c.width = Math.round(ancho * dpr); c.height = Math.round(alto * dpr);
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

/** Escala «bonita» del eje vertical. */
function pasoBonito(max: number, marcas = 4) {
  const bruto = max / marcas;
  const e = Math.pow(10, Math.floor(Math.log10(Math.max(bruto, 1e-9))));
  const f = bruto / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
}

export interface OpcionesHistograma {
  cont: number[];
  /** predicción del alumno (si es válida) */
  prediccion: { mu: number; sigma: number } | null;
  /** p del modelo: SÓLO tras validar */
  teoria: number | null;
  tema: 'oscuro' | 'claro';
  /** canal resaltado (la última bolita) */
  resaltar?: number | null;
}

/** Histograma de la muestra con las curvas que correspondan. Compartido con la bitácora. */
export function dibujarHistograma(ctx: CanvasRenderingContext2D, w: number, h: number, o: OpcionesHistograma) {
  const oscuro = o.tema === 'oscuro';
  const N = o.cont.reduce((a, b) => a + b, 0);
  const m = { l: 26, r: 6, t: 8, b: 20 };
  const X = (k: number) => m.l + ((k + 0.5) / CONTENEDORES) * (w - m.l - m.r);
  const anchoBarra = ((w - m.l - m.r) / CONTENEDORES) * 0.8;
  // la escala vertical cubre la muestra y lo que se dibuje encima
  let yMax = Math.max(4, ...o.cont);
  if (o.prediccion && N > 0) yMax = Math.max(yMax, (N * densidadNormal(o.prediccion.mu, o.prediccion.mu, o.prediccion.sigma)));
  if (o.teoria != null && N > 0) for (let k = 0; k < CONTENEDORES; k++) yMax = Math.max(yMax, N * pmfBinomial(k, o.teoria));
  const paso = pasoBonito(yMax * 1.05);
  yMax = Math.ceil((yMax * 1.05) / paso) * paso;
  const Y = (v: number) => h - m.b - (v / yMax) * (h - m.t - m.b);
  const f = familia();
  // rejilla y ejes
  ctx.lineWidth = 1;
  ctx.strokeStyle = oscuro ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.08)';
  for (let v = paso; v <= yMax + 1e-9; v += paso) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(v)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(v)) + 0.5); ctx.stroke(); }
  ctx.strokeStyle = oscuro ? 'rgba(148,163,184,0.45)' : 'rgba(15,23,42,0.35)';
  ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
  ctx.fillStyle = oscuro ? '#94a3b8' : '#64748b';
  ctx.font = `500 10px ${f}`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let v = 0; v <= yMax + 1e-9; v += paso) ctx.fillText(String(Math.round(v)), m.l - 4, Y(v));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let k = 0; k < CONTENEDORES; k++) ctx.fillText(String(k), X(k), h - m.b + 4);
  // barras de la muestra
  for (let k = 0; k < CONTENEDORES; k++) {
    const c = o.cont[k] ?? 0;
    if (!c) continue;
    const x = X(k) - anchoBarra / 2, y = Y(c);
    const g = ctx.createLinearGradient(0, y, 0, Y(0));
    const res = o.resaltar === k;
    g.addColorStop(0, oscuro ? (res ? '#e2ecf6' : '#b7c8d9') : (res ? '#5b7fa6' : '#7d97b4'));
    g.addColorStop(1, oscuro ? '#5d7186' : '#b9c8d8');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, anchoBarra, Y(0) - y);
    ctx.fillStyle = oscuro ? COL.barraBorde : '#3b5878';
    ctx.fillRect(x, y, anchoBarra, 1.5);
  }
  const curva = (mu: number, sigma: number, color: string, ancho: number, rayas: number[]) => {
    ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(rayas); ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const k = -0.5 + (i / 160) * CONTENEDORES;
      const x = m.l + ((k + 0.5) / CONTENEDORES) * (w - m.l - m.r);
      const y = Y(Math.min(yMax, N * densidadNormal(k, mu, sigma)));
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
  };
  if (N > 0 && o.teoria != null) {
    const p = o.teoria;
    curva(FILAS * p, Math.sqrt(FILAS * p * (1 - p)), COL.normal, 1.6, []);
    for (let k = 0; k < CONTENEDORES; k++) {
      const v = N * pmfBinomial(k, p);
      ctx.fillStyle = oscuro ? COL.binom : '#0f172a';
      ctx.beginPath(); ctx.arc(X(k), Y(v), 2.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (N > 0 && o.prediccion) curva(o.prediccion.mu, o.prediccion.sigma, oscuro ? COL.pred : '#d97706', 1.8, [5, 3]);
}

/** Lo que el alumno escribió, si es una predicción dibujable. */
export function prediccionValida(mu: string, sigma: string) {
  const a = leerNumero(mu), b = leerNumero(sigma);
  return Number.isFinite(a) && Number.isFinite(b) && b > 0 && b < 20 && Math.abs(a) < 50 ? { mu: a, sigma: b } : null;
}

const ALTO_MAX = 210, ALTO_MIN = 120;
const fmt = (v: number, d: number) => (Number.isFinite(v) ? v.toFixed(d) : '—');

export function DockGalton() {
  const { probabilidad: p, contenedores, status, prediccionMedia, prediccionSigma } = useSimuladorStore(useShallow((s) => ({
    probabilidad: s.galton10.probabilidad, contenedores: s.galton10.contenedores, status: s.galton10.status,
    prediccionMedia: s.galton10.prediccionMedia, prediccionSigma: s.galton10.prediccionSigma,
  })));
  const { ultima, lleno } = useBancoGalton(useShallow((s) => ({ ultima: s.ultima, lleno: s.lleno })));
  const muestra = useMemo(() => estadisticaMuestraM10(contenedores), [contenedores]);
  const N = muestra.N;
  const validado = status === 'success';
  const pred = prediccionValida(prediccionMedia, prediccionSigma);
  const chi = useMemo(() => (validado ? chiCuadradaM10(contenedores, p) : null), [validado, contenedores, p]);

  // el dock cabe sin scroll: el histograma cede altura si el panel es bajo
  const raiz = useRef<HTMLDivElement>(null);
  const [alto, setAlto] = useState(ALTO_MAX);
  const altoActual = useRef(ALTO_MAX);
  useLayoutEffect(() => {
    const el = raiz.current, caja = el?.parentElement;
    if (!el || !caja) return;
    const ajustar = () => {
      const cs = getComputedStyle(caja);
      const util = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const det = el.querySelector('details');
      const abierto = det?.open ? det.offsetHeight - (det.querySelector('summary')?.offsetHeight ?? 0) - 12 : 0;
      const resto = el.scrollHeight - abierto - altoActual.current;
      const h = Math.max(ALTO_MIN, Math.min(ALTO_MAX, Math.floor(util - resto)));
      if (h !== altoActual.current) { altoActual.current = h; setAlto(h); }
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(caja); ro.observe(el);
    ajustar();
    return () => ro.disconnect();
  }, []);

  const resaltar = ultima?.k ?? null;
  const dibujar = (ctx: CanvasRenderingContext2D, w: number, h: number) =>
    dibujarHistograma(ctx, w, h, { cont: contenedores, prediccion: pred, teoria: validado ? p : null, tema: 'oscuro', resaltar });

  const pct = Math.min(1, N / MUESTRA_MIN_M10);
  return (
    <div ref={raiz} className="space-y-2.5" data-dock="galton">
      {/* muestra */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Histograma</span>
          <span className="font-mono text-[12px] font-semibold tabular-nums text-white" data-lectura="N">
            N = {N}<span className="text-slate-500"> / {MUESTRA_MIN_M10}</span>
          </span>
        </div>
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <i className={`block h-full ${pct >= 1 ? 'bg-emerald-400' : 'bg-[#FB8500]'}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <Lienzo alto={alto} dibujar={dibujar} etiqueta="Histograma de la muestra: bolitas por contenedor"
          deps={[contenedores, pred?.mu, pred?.sigma, validado, p, resaltar]} />
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-1"><i className="inline-block h-2 w-2.5 rounded-[2px] bg-[#9fb4c8]" />muestra</span>
          <span className="flex items-center gap-1" style={{ color: pred ? COL.pred : undefined }}>
            <i className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: pred ? COL.pred : '#64748b' }} />tu curva teórica
          </span>
          {validado && (
            <>
              <span className="flex items-center gap-1 text-slate-200"><i className="inline-block h-1.5 w-1.5 rounded-full bg-slate-100" />binomial</span>
              <span className="flex items-center gap-1" style={{ color: COL.normal }}><i className="inline-block w-3 border-t-2" style={{ borderColor: COL.normal }} />normal</span>
            </>
          )}
        </div>
        {lleno && <p role="status" className="mt-1.5 text-[11px] font-semibold text-amber-300">Un canal está lleno ({CAPACIDAD}): vacía la máquina para seguir.</p>}
      </section>

      {/* estadísticos */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono tabular-nums">
          <span className="flex items-baseline justify-between"><span className="text-[11px] font-semibold text-slate-400">x̄</span><span className="text-[15px] font-semibold text-white" data-lectura="media">{fmt(muestra.media, 2)}</span></span>
          <span className="flex items-baseline justify-between"><span className="text-[11px] font-semibold text-slate-400">s</span><span className="text-[15px] font-semibold text-white" data-lectura="sigma">{fmt(muestra.sigma, 2)}</span></span>
          {validado && (
            <>
              <span className="flex items-baseline justify-between"><span className="text-[11px] font-semibold text-emerald-300">μ = np</span><span className="text-[15px] font-semibold text-emerald-200">{(FILAS * p).toFixed(2)}</span></span>
              <span className="flex items-baseline justify-between"><span className="text-[11px] font-semibold text-emerald-300">σ</span><span className="text-[15px] font-semibold text-emerald-200">{Math.sqrt(FILAS * p * (1 - p)).toFixed(2)}</span></span>
            </>
          )}
        </div>
        {chi && (
          <p className="mt-1.5 flex flex-wrap gap-x-2 font-mono text-[11px] font-semibold tabular-nums text-emerald-300" data-lectura="chi2">
            <span className="whitespace-nowrap">χ² = {chi.chi2.toFixed(2)}</span>
            <span className="whitespace-nowrap">gl {chi.gl}</span>
            <span className="whitespace-nowrap">p-valor {pValorChi2(chi.chi2, chi.gl).toFixed(2)}</span>
          </p>
        )}
      </section>

      {/* la última bolita */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Última bolita</span>
          {ultima && <span className="font-mono text-[12px] font-semibold tabular-nums text-white">k = {ultima.k}</span>}
        </div>
        <div className="flex h-5 items-center gap-[3px]" aria-label={ultima ? `Decisiones: ${ultima.decisiones.map((d) => (d > 0 ? 'derecha' : 'izquierda')).join(', ')}` : 'Aún no ha caído ninguna'}>
          {Array.from({ length: FILAS }, (_, i) => {
            const d = ultima?.decisiones[i];
            return (
              <span key={i} className={`flex h-5 flex-1 items-center justify-center rounded ${d == null ? 'bg-white/[0.04]' : d > 0 ? 'bg-[#FB8500]/25 text-[#FFB703]' : 'bg-sky-400/15 text-sky-300'}`}>
                {d == null ? null : d > 0 ? <ArrowRight size={11} strokeWidth={2.6} /> : <ArrowLeft size={11} strokeWidth={2.6} />}
              </span>
            );
          })}
        </div>
      </section>

      <details className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-300">
        <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-slate-400">Modelo y límites</summary>
        <ul className="mt-1.5 space-y-1 font-mono text-[11px] leading-snug text-slate-200">
          <li>P(k) = C(10, k)·pᵏ·(1 − p)¹⁰⁻ᵏ</li>
          <li>p = ½ + h·tan α / (2w)</li>
          <li>w = {(W_IMPACTO * 10).toFixed(2)} mm · h = {(DY_FILA * 10).toFixed(1)} mm</li>
          <li>burbuja: s = R·α, R = {R_VIAL} cm</li>
          <li>χ² = Σ (O − E)²/E (E ≥ 5)</li>
        </ul>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 leading-snug">
          <li>Cada clavo decide con Bernoulli(p), independiente de los demás: el punto de impacto se sortea uniforme en ±w (corrido h·tan α por la inclinación).</li>
          <li>Entre clavos, parábolas con la gravedad del tablero inclinado; el bote es de choque con restitución, ajustado para llegar al clavo que tocó la decisión.</li>
          <li>Las bolitas no chocan entre sí en el aire; en el canal se apilan en hexagonal compacto.</li>
          <li>La tolva no se vacía; cada canal admite {CAPACIDAD} bolitas.</li>
          <li>Cámara lenta ×¼: la caída real dura ~1 s.</li>
        </ul>
      </details>
    </div>
  );
}
