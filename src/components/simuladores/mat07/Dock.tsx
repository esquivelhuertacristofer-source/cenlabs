'use client';
/**
 * mat07/Dock.tsx — el dock de instrumentos del banco de Snell, en DOM nítido
 * (lienzos a devicePixelRatio, tipografía del lab). Lee la MISMA fase φ que la
 * escena está mostrando (`faseVis` del store del banco): reloj único.
 *
 *  - Fotómetro de la cara plana: R y T (Fresnel) con la polarización elegida.
 *  - Curva de Fresnel R(θ₁) con su marcador. Con el cristal MISTERIOSO la curva
 *    teórica NO se dibuja hasta validar (su mínimo de R_p, en tan θ_B = n₂, o el
 *    muro del ángulo crítico darían n₂ sin medir): sólo los puntos que el fotómetro
 *    ha leído en los ángulos que el alumno ha visitado.
 *  - Mis mediciones: el alumno anota el θ₂ que LEE en el disco; los puntos
 *    (sen θ bloque, sen θ aire) se dibujan; la recta ajustada (pendiente = n₂) sólo
 *    aparece tras validar.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Trash2, Plus, X } from 'lucide-react';
import {
  abbeDe, indiceA, laserDe, lecturaBanco, desdeFase, faseDe, fresnel, reflectanciaPol, brewster, anguloCritico,
  indicesInterfaz, pendienteOrigen, puntoMedicion, colorLambda, rad, grados, type Polarizacion,
} from './optica';
import { useBancoSnell } from './banco';

export interface DockProps {
  n1: number;
  n2: number | string;
  n2Misterio: number;
  anguloIncidencia: number;
  status: 'idle' | 'success' | 'error';
}

const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 2 : 1)} %`;
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

/** Ejes y rejilla comunes. Devuelve las funciones de escala. */
function ejes(ctx: CanvasRenderingContext2D, w: number, h: number, o: {
  xMax: number; yMax: number; xTicks: number[]; yTicks: number[]; xFmt: (v: number) => string; yFmt: (v: number) => string; xLabel: string; yLabel: string;
}) {
  const m = { l: 30, r: 8, t: 8, b: 24 };
  const X = (v: number) => m.l + (v / o.xMax) * (w - m.l - m.r);
  const Y = (v: number) => h - m.b - (v / o.yMax) * (h - m.t - m.b);
  const f = familia();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(148,163,184,0.14)';
  for (const t of o.xTicks) { ctx.beginPath(); ctx.moveTo(Math.round(X(t)) + 0.5, m.t); ctx.lineTo(Math.round(X(t)) + 0.5, h - m.b); ctx.stroke(); }
  for (const t of o.yTicks) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(t)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(t)) + 0.5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 10px ${f}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const t of o.xTicks) ctx.fillText(o.xFmt(t), X(t), h - m.b + 4);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of o.yTicks) ctx.fillText(o.yFmt(t), m.l - 4, Y(t));
  ctx.font = `600 10px ${f}`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(o.xLabel, w - m.r, h - m.b - 3);
  ctx.save(); ctx.translate(m.l + 4, m.t); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.yLabel, 0, 0); ctx.restore();
  return { X, Y, m };
}

function trazo(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, ancho: number, rayas: number[] = []) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(rayas); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.setLineDash([]);
}

const COL_RS = '#f59e0b', COL_RP = '#60a5fa', COL_R = '#e2e8f0';
const ALTO_GRAF_MAX = 132, ALTO_GRAF_MIN = 84;

export function DockInstrumentos({ n1, n2, n2Misterio, anguloIncidencia, status }: DockProps) {
  const { laser, sentido, pol, faseVis, mediciones, setPol, anotar, borrarMedicion, borrarMediciones } = useBancoSnell(useShallow((s) => ({
    laser: s.laser, sentido: s.sentido, pol: s.pol, faseVis: s.faseVis, mediciones: s.mediciones,
    setPol: s.setPol, anotar: s.anotar, borrarMedicion: s.borrarMedicion, borrarMediciones: s.borrarMediciones,
  })));
  const misterio = n2 === 'misterio';
  const nD = misterio ? n2Misterio : Number(n2);
  const V = abbeDe(nD, misterio);
  const lam = laserDe(laser).lambdaNm;
  const nL = indiceA(nD, V, lam);
  const teoria = !misterio || status === 'success';
  // reloj único: lo que la escena muestra en este cuadro (o el objetivo si no hay escena)
  const fase = faseVis ?? faseDe(sentido, anguloIncidencia);
  const vis = desdeFase(fase);
  const lectura = lecturaBanco({ sentido: vis.sentido, theta1: vis.theta1, n1, nD, V, laser, pol });
  const [nInc, nTr] = indicesInterfaz(vis.sentido, n1, nL);
  const colLaser = useMemo(() => {
    const c = lam == null ? [1, 1, 1] : colorLambda(lam);
    return `rgb(${c.map((v) => Math.round(255 * Math.pow(v, 1 / 2.2))).join(',')})`;
  }, [lam]);

  // puntos que el fotómetro ha leído (para el misterio): por configuración
  const claveConf = `${vis.sentido}|${pol}|${laser}|${nD}`;
  const leidos = useRef(new Map<string, Map<number, number>>());
  const asentado = faseVis == null || Math.abs(faseVis - faseDe(sentido, anguloIncidencia)) < 1e-6;
  if (asentado) {
    let m = leidos.current.get(claveConf);
    if (!m) { m = new Map(); leidos.current.set(claveConf, m); }
    m.set(Math.round(vis.theta1), lectura.R);
  }
  const trazaLeida = [...(leidos.current.get(claveConf)?.entries() ?? [])];

  const dibujarFresnel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { X, Y } = ejes(ctx, w, h, {
      xMax: 90, yMax: 1, xTicks: [0, 30, 60, 90], yTicks: [0, 0.5, 1], xFmt: (v) => `${v}°`, yFmt: (v) => `${v * 100}`,
      xLabel: 'θ₁', yLabel: 'R (%)',
    });
    if (teoria) {
      const curva = (sel: (f: ReturnType<typeof fresnel>) => number) => Array.from({ length: 181 }, (_, i) => {
        const a = i * 0.5; const f = fresnel(nInc, nTr, rad(Math.min(a, 89.999)));
        return [X(a), Y(sel(f))] as [number, number];
      });
      const tb = grados(brewster(nInc, nTr));
      ctx.strokeStyle = 'rgba(96,165,250,0.35)'; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(tb), Y(0)); ctx.lineTo(X(tb), Y(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#93c5fd'; ctx.font = `600 10px ${familia()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('θB', X(tb), Y(0.82));
      const tc = anguloCritico(nInc, nTr);
      if (tc != null) {
        const c = grados(tc);
        ctx.fillStyle = 'rgba(248,113,113,0.08)'; ctx.fillRect(X(c), Y(1), X(90) - X(c), Y(0) - Y(1));
        ctx.strokeStyle = 'rgba(248,113,113,0.6)'; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X(c), Y(0)); ctx.lineTo(X(c), Y(1)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#fca5a5'; ctx.fillText('θc', X(c), Y(0.62));
      }
      trazo(ctx, curva((f) => f.Rs), COL_RS, pol === 's' ? 2.2 : 1.2, [5, 3]);
      trazo(ctx, curva((f) => f.Rp), COL_RP, pol === 'p' ? 2.2 : 1.2, [1.5, 2.5]);
      trazo(ctx, curva((f) => f.R), COL_R, pol === 'natural' ? 2.2 : 1.2);
    } else {
      for (const [a, r] of trazaLeida) {
        ctx.fillStyle = 'rgba(226,232,240,0.55)';
        ctx.beginPath(); ctx.arc(X(a), Y(r), 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // marcador: la lectura de ahora, en el mismo instante que la escena
    const x = X(vis.theta1), y = Y(lectura.R);
    ctx.fillStyle = colLaser; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  };

  // mediciones del alumno
  const pts = mediciones.map((m) => ({ ...puntoMedicion(m.sentido, m.theta1, m.leido), id: m.id }));
  const m = status === 'success' ? pendienteOrigen(pts) : null;
  const dibujarMediciones = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const xMax = 1, yMax = 1;
    const { X, Y } = ejes(ctx, w, h, {
      xMax, yMax, xTicks: [0, 0.5, 1], yTicks: [0, 0.5, 1], xFmt: (v) => v.toFixed(1), yFmt: (v) => v.toFixed(1),
      xLabel: 'sen θ bloque', yLabel: 'sen θ aire',
    });
    if (m != null) {
      trazo(ctx, [[X(0), Y(0)], [X(Math.min(xMax, yMax / m)), Y(Math.min(yMax, m * xMax))]], '#34d399', 2);
      if (status === 'success') trazo(ctx, [[X(0), Y(0)], [X(Math.min(xMax, 1 / nD)), Y(Math.min(1, nD * xMax))]], 'rgba(226,232,240,0.5)', 1, [4, 3]);
    }
    for (const p of pts) {
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  };

  const [leido, setLeido] = useState('');
  const valorLeido = Number(leido.replace(',', '.'));
  const leidoValido = leido.trim() !== '' && Number.isFinite(valorLeido) && valorLeido >= 0 && valorLeido < 90;
  const anotarAhora = () => {
    if (!leidoValido) return;
    anotar({ sentido, theta1: anguloIncidencia, leido: valorLeido, laser });
    setLeido('');
  };

  // el dock cabe sin scroll: las dos gráficas ceden altura (132 → 64 px) si el panel es bajo
  const raiz = useRef<HTMLDivElement>(null);
  const [altoGraf, setAltoGraf] = useState(ALTO_GRAF_MAX);
  const altoActual = useRef(ALTO_GRAF_MAX);
  useLayoutEffect(() => {
    const el = raiz.current, caja = el?.parentElement;
    if (!el || !caja) return;
    const ajustar = () => {
      const cs = getComputedStyle(caja);
      const util = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      // todo lo que no son las gráficas, con el desplegable del modelo CERRADO (abrirlo es
      // decisión del alumno: entonces sí hay scroll, pero las gráficas no encogen de golpe)
      const det = el.querySelector('details');
      const abierto = det?.open ? det.offsetHeight - (det.querySelector('summary')?.offsetHeight ?? 0) - 12 : 0;
      const resto = el.scrollHeight - abierto - 2 * altoActual.current;
      const h = Math.max(ALTO_GRAF_MIN, Math.min(ALTO_GRAF_MAX, Math.floor((util - resto) / 2)));
      if (h !== altoActual.current) { altoActual.current = h; setAltoGraf(h); }
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(caja); ro.observe(el);
    ajustar();
    return () => ro.disconnect();
  }, []);

  const POLS: { v: Polarizacion; t: string; d: string }[] = [
    { v: 'natural', t: 'Natural', d: 'Luz no polarizada: R = (Rs + Rp)/2' },
    { v: 's', t: 's', d: 'Campo eléctrico perpendicular al plano de incidencia' },
    { v: 'p', t: 'p', d: 'Campo eléctrico en el plano de incidencia: se anula en el ángulo de Brewster' },
  ];

  return (
    <div ref={raiz} className="space-y-2.5" data-dock="snell">
      {/* fotómetro */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400" title="R y T en la cara plana del bloque">Fotómetro</span>
          <div className="flex rounded-md border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label="Polarización">
            {POLS.map((o) => (
              <button key={o.v} type="button" title={o.d} onClick={() => setPol(o.v)}
                className={`h-6 rounded px-2 text-[11px] font-semibold ${pol === o.v ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>{o.t}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-mono tabular-nums">
          <span><span className="mr-1 text-[11px] font-semibold text-amber-300">R</span><span className="text-[18px] font-semibold text-white" data-lectura="R">{pct(lectura.R)}</span></span>
          <span><span className="mr-1 text-[11px] font-semibold" style={{ color: colLaser }}>T</span><span className="text-[18px] font-semibold text-white" data-lectura="T">{pct(lectura.T)}</span></span>
        </div>
        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <i className="block h-full bg-amber-300" style={{ width: `${lectura.R * 100}%` }} />
          <i className="block h-full" style={{ width: `${lectura.T * 100}%`, background: colLaser, opacity: 0.85 }} />
        </div>
      </section>

      {/* Fresnel */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fresnel · R(θ₁)</span>
          {teoria ? (
            <span className="flex gap-2 text-[10px] font-semibold">
              <span style={{ color: COL_RS }}>Rs</span><span style={{ color: COL_RP }}>Rp</span><span style={{ color: COL_R }}>R</span>
            </span>
          ) : <span className="text-[10px] text-slate-500">curva al validar</span>}
        </div>
        <Lienzo alto={altoGraf} dibujar={dibujarFresnel} etiqueta="Reflectancia de Fresnel frente al ángulo de incidencia"
          deps={[teoria, nInc, nTr, pol, vis.theta1, lectura.R, colLaser, trazaLeida.length, claveConf]} />
      </section>

      {/* mediciones del alumno (compacto: cabe en el panel estrecho sin scroll) */}
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Mis mediciones{mediciones.length > 0 && <span className="ml-1 font-mono normal-case text-slate-500">· {mediciones.length}</span>}
          </span>
          {mediciones.length > 0 && (
            <button type="button" onClick={borrarMediciones} className="flex items-center gap-1 rounded px-1 text-[10px] text-slate-400 hover:text-rose-300" aria-label="Borrar todas las mediciones">
              <Trash2 size={11} /> borrar
            </button>
          )}
        </div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <label className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-slate-300" title={`Ángulo leído en el disco con θ₁ = ${anguloIncidencia}°`}>
            θ₂
            <input type="text" inputMode="decimal" value={leido} onChange={(e) => setLeido(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') anotarAhora(); }} placeholder="leído °" aria-label="Ángulo θ₂ leído en el disco, en grados"
              className="h-7 w-[4.5rem] rounded-md border border-white/15 bg-white/[0.05] px-2 font-mono text-[12px] text-white outline-none placeholder:text-slate-500 focus:border-[#219EBC]" />
          </label>
          <button type="button" onClick={anotarAhora} disabled={!leidoValido}
            className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-[#219EBC] px-2 text-[11px] font-semibold text-white disabled:opacity-40">
            <Plus size={12} /> Anotar
          </button>
        </div>
        <Lienzo alto={altoGraf} dibujar={dibujarMediciones} etiqueta="Mediciones: seno del ángulo en el aire frente al seno del ángulo en el bloque"
          deps={[pts.map((p) => `${p.x},${p.y}`).join(';'), m, status, nD]} />
        {mediciones.length === 0 ? (
          <p className="mt-1 text-[11px] leading-snug text-slate-400">Lee θ₂ donde el haz cruza la escala (vista Lupa) y anótalo.</p>
        ) : (
          // una sola fila, la más reciente primero: lo que no cabe se oculta (el total va en la cabecera)
          <div className="mt-1.5 flex max-h-[22px] flex-wrap gap-1 overflow-hidden">
            {[...mediciones].reverse().map((md) => (
              <span key={md.id} className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px] text-slate-200">
                {md.sentido === 'aire-bloque' ? '' : '↺'}{md.theta1}°→{md.leido}°
                <button type="button" onClick={() => borrarMedicion(md.id)} aria-label="Borrar medición" className="text-slate-500 hover:text-rose-300"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        {m != null && (
          <p className="mt-1.5 text-[11px] font-semibold tabular-nums text-emerald-300">pendiente {m.toFixed(3)} · n₂ real {nD.toFixed(2)}</p>
        )}
      </section>

      <details className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-300">
        <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-slate-400">Modelo y límites</summary>
        <ul className="mt-1.5 space-y-1 font-mono text-[11px] leading-snug text-slate-200">
          <li>n₁·sen θ₁ = n₂·sen θ₂</li>
          <li>r_s = (n₁cos θ₁ − n₂cos θ₂)/(n₁cos θ₁ + n₂cos θ₂)</li>
          <li>r_p = (n₂cos θ₁ − n₁cos θ₂)/(n₂cos θ₁ + n₁cos θ₂)</li>
          <li>R = (r_s² + r_p²)/2 · T = 1 − R</li>
          <li>tan θ_B = n₂/n₁ · sen θ_c = n₂/n₁ (n₁ &gt; n₂)</li>
          <li>n(λ) = A + B/λ² (Cauchy, ajustado a n_D y Abbe)</li>
          <li>P(s) = P₀·e^(−μs) en la bruma</li>
        </ul>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 leading-snug">
          <li>Sólo el primer orden: se omiten el ~4 % que la cara curva devuelve hacia dentro y los rebotes múltiples.</li>
          <li>Haz ideal, sin divergencia; el ancho dibujado es el de la luz dispersada.</li>
          <li>n₂ de la tabla y del reto es n_D (589 nm); con otro láser cambia según Cauchy (el cristal misterioso, ≤ 0,03).</li>
          <li>La bruma ocupa ~20 cm alrededor del disco; fuera de ella el haz sigue, pero no se ve.</li>
          <li>Los colores de pantalla salen de la λ (CIE 1931); la física no los usa.</li>
        </ul>
      </details>
    </div>
  );
}
