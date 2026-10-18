'use client';
/**
 * qmi10/Dock.tsx — los instrumentos de la columna en DOM nítido (lienzos a devicePixelRatio).
 * Lee el MISMO reloj que la escena (`RelojDestilacion`): la escalera, el perfil y las cifras
 * salen del mismo cuadro que los colores de los platos.
 *
 *  - Diagrama x–y de McCabe–Thiele: curva de equilibrio, diagonal, rectas de rectificación
 *    (pendiente R/(R + 1)), de alimentación (q = 1) y de agotamiento, y la ESCALERA de la columna
 *    dibujada etapa a etapa con las composiciones reales de cada plato (la escena resalta el plato
 *    que se está dibujando).
 *  - Perfil: composición del líquido y temperatura de cada etapa, de la cabeza al hervidor.
 *  - Reto: temperatura de cabeza frente al destilado recogido.
 *
 * NO REGALAR. En el reto, antes de validar, no hay escalera, ni etapas efectivas, ni composición
 * del destilado: sólo la curva de equilibrio, el matraz y lo que mediría el alumno (temperaturas).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { N_PLATOS, ETAPAS, MEZCLAS, cssComposicion, rectaRectificacion, enRecta, AZEOTROPO_ETANOL } from './columna';
import type { RelojDestilacion } from './reloj';
import { R_RETO } from './reloj';
import { cifra } from './formato';

export { cifra };

// ───────────────────────────── reloj → React ─────────────────────────────

export function useTickReloj(reloj: React.MutableRefObject<RelojDestilacion>, hz = 24): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimoR: RelojDestilacion | null = null, t0 = 0;
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

const COL_RECT = '#7dd3fc';
const COL_AGOT = '#fdba74';
const NOMBRE_ETAPA = (i: number) => (i === 0 ? 'Cabeza' : i === N_PLATOS + 1 ? 'Hervidor' : `Plato ${i}`);

// ───────────────────────────── dock ─────────────────────────────

export interface DockDestilacionProps {
  reloj: React.MutableRefObject<RelojDestilacion>;
  modo: 'explorar' | 'reto';
  /** reto validado: ya se pueden dibujar la escalera y las etapas efectivas */
  revela: boolean;
  docente?: boolean;
  pie?: React.ReactNode;
}

type Pestana = 'diagrama' | 'perfil' | 'modelo';
const ALTO_DIAG_MAX = 340, ALTO_DIAG_MIN = 170;
/** Por debajo de este alto útil el dock pasa a pestañas (una sección a la vez). */
const ALTO_APILADO = { explorar: 540, reto: 640 };

export function DockDestilacion({ reloj, modo, revela, docente = false, pie }: DockDestilacionProps) {
  const tick = useTickReloj(reloj);
  const r = reloj.current;
  const v = r.vista;
  const reto = modo === 'reto';
  const m = reto ? MEZCLAS.etanolAgua : r.mezcla;
  const ligero = m.ligero;

  // ── alto disponible: apilado o pestañas ──
  const raiz = useRef<HTMLDivElement>(null);
  const [util, setUtil] = useState(800);
  const [altoDiag, setAltoDiag] = useState(240);
  const altoActual = useRef(240);
  const apilado = util >= ALTO_APILADO[modo];
  const [pestana, setPestana] = useState<Pestana>('diagrama');
  const vista: Pestana = apilado && pestana === 'perfil' ? 'diagrama' : pestana;
  useLayoutEffect(() => {
    const el = raiz.current, caja = el?.parentElement;
    if (!el || !caja) return;
    const ajustar = () => {
      const cs = getComputedStyle(caja);
      const u = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      setUtil(u);
      const resto = el.scrollHeight - altoActual.current;
      // el diagrama x–y es cuadrado: no más alto que su ancho
      const tope = Math.min(ALTO_DIAG_MAX, Math.round(el.clientWidth * 0.98));
      const hh = Math.max(ALTO_DIAG_MIN, Math.min(tope, Math.floor(u - resto - 2)));
      if (hh !== altoActual.current) { altoActual.current = hh; setAltoDiag(hh); }
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(caja); ro.observe(el);
    ajustar();
    return () => ro.disconnect();
  }, [apilado, vista]);

  // en el reto la columna del store trabaja a reflujo casi total (R = 4 en el divisor)
  const escalera = !reto || revela;
  const xD = v.x[0], xB = v.x[N_PLATOS + 1];
  const total = !reto && r.op.total;
  const R = reto ? R_RETO : r.op.R;
  const curvaEq = useMemo(() => {
    const p: [number, number][] = [];
    const xMax = m.azeotropo ?? 1;
    for (let i = 0; i <= 120; i++) { const x = (xMax * i) / 120; p.push([x, m.yEq(x)]); }
    if (m.azeotropo) p.push([1, 1]);
    return p;
  }, [m]);

  // ── diagrama x–y ──
  const dibujarXY = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const f = familia();
    const ml = 30, mr = 12, mt = 8, mb = 26;
    const L = Math.max(60, Math.min(w - ml - mr, h - mt - mb));
    const x0 = ml + Math.max(0, (w - ml - mr - L) / 2), y0 = mt + L;
    const X = (x: number) => x0 + x * L, Y = (y: number) => y0 - y * L;
    // rejilla
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    for (let k = 0; k <= 10; k += 2) {
      const t = k / 10;
      ctx.beginPath(); ctx.moveTo(Math.round(X(t)) + 0.5, Y(0)); ctx.lineTo(Math.round(X(t)) + 0.5, Y(1)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(0), Math.round(Y(t)) + 0.5); ctx.lineTo(X(1), Math.round(Y(t)) + 0.5); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.strokeRect(Math.round(X(0)) + 0.5, Math.round(Y(1)) + 0.5, Math.round(L), Math.round(L));
    ctx.fillStyle = '#94a3b8'; ctx.font = `500 10px ${f}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of [0, 0.5, 1]) ctx.fillText(cifra(t, t === 0.5 ? 1 : 0), X(t), Y(0) + 13);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const t of [0, 0.5, 1]) ctx.fillText(cifra(t, t === 0.5 ? 1 : 0), X(0) - 4, Y(t));
    ctx.font = `600 10px ${f}`; ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(`y ${ligero} (vapor)`, X(0) + 4, Y(1) + 3);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`x ${ligero} (líquido)`, X(1) - 3, Y(0) - 3);
    // diagonal
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(203,213,225,0.45)';
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(1)); ctx.stroke(); ctx.setLineDash([]);
    // curva de equilibrio
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.7;
    ctx.beginPath(); curvaEq.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.stroke();
    if (m.azeotropo) {
      const a = AZEOTROPO_ETANOL;
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(X(a), Y(a), 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = `600 10px ${f}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = '#e2e8f0';
      ctx.fillText('azeótropo', X(a) - 4, Y(a) + 12);
    }
    // rectas de operación (exploración): rectificación, q = 1 y agotamiento
    if (!reto && !total) {
      const rec = rectaRectificacion(R, xD);
      const yq = enRecta(rec, m.z);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = COL_RECT; ctx.beginPath(); ctx.moveTo(X(xD), Y(xD)); ctx.lineTo(X(m.z), Y(yq)); ctx.stroke();
      ctx.strokeStyle = COL_AGOT; ctx.beginPath(); ctx.moveTo(X(m.z), Y(yq)); ctx.lineTo(X(xB), Y(xB)); ctx.stroke();
      ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(m.z), Y(m.z)); ctx.lineTo(X(m.z), Y(yq)); ctx.stroke(); ctx.setLineDash([]);
    }
    // marcas en el eje x
    const marca = (x: number, txt: string, col: string, fila: number) => {
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(X(x)) + 0.5, Y(0)); ctx.lineTo(Math.round(X(x)) + 0.5, Y(0) + 4); ctx.stroke();
      ctx.fillStyle = col; ctx.font = `700 10px ${f}`; ctx.textBaseline = 'top';
      ctx.textAlign = X(x) < X(0) + 24 ? 'left' : X(x) > X(1) - 24 ? 'right' : 'center';
      // fila −1: junto al pie de la recta q sobre la diagonal, (z, z) (no choca con x_B ni con los rótulos del eje)
      if (fila < 0) { ctx.textAlign = 'left'; ctx.fillText(txt, X(x) + 4, Y(x) + 2); } else ctx.fillText(txt, X(x), Y(0) + 2 + fila * 11);
    };
    if (escalera) {
      marca(xB, 'x_B', COL_AGOT, 0);
      if (!reto) marca(m.z, 'z', '#e2e8f0', -1);
      marca(xD, 'x_D', COL_RECT, 0);
    } else {
      marca(v.hervidor.x, 'matraz', '#e2e8f0', 0);
    }
    // la escalera de la columna, etapa a etapa, con las composiciones de ahora
    if (escalera) {
      const xs = v.x, ys = v.y;
      const nEt = Math.min(ETAPAS, r.escalon);
      ctx.lineWidth = 1.8; ctx.strokeStyle = '#ffffff'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(X(xD), Y(xD));
      // (x_D, x_D) → (x_D, y₁) es la condensación total (y₁ = x_D en régimen)
      let px = xD, py = xD;
      ctx.lineTo(X(xD), Y(ys[1])); py = ys[1];
      for (let k = 1; k <= ETAPAS; k++) {
        const u = Math.max(0, Math.min(1, nEt - (k - 1)));
        if (u <= 0) break;
        const xk = xs[k], yk = ys[k];
        const uH = Math.min(1, u * 2), uV = Math.max(0, u * 2 - 1);
        // horizontal hasta la curva (plato k en equilibrio)
        ctx.lineTo(X(px + (xk - px) * uH), Y(py));
        if (uH < 1) break;
        px = xk;
        // vertical hasta la recta de operación (el vapor que sube del plato de abajo)
        const yNext = k < ETAPAS ? ys[k + 1] : xk;
        ctx.lineTo(X(px), Y(yk + (yNext - yk) * uV));
        if (uV < 1) break;
        py = yNext;
      }
      ctx.stroke();
      // los puntos de cada etapa con el código de color
      for (let k = 1; k <= Math.min(ETAPAS, Math.floor(nEt + 0.5)); k++) {
        ctx.fillStyle = cssComposicion(xs[k]); ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(X(xs[k]), Y(ys[k]), k === r.etapaResaltada ? 5 : 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      const e = r.etapaResaltada;
      if (e > 0) {
        ctx.fillStyle = '#f8fafc'; ctx.font = `700 10px ${f}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const tx = X(xs[e]) + 8, ty = Y(ys[e]);
        ctx.fillText(NOMBRE_ETAPA(e), Math.min(tx, X(1) - 50), ty);
      }
    }
    // el punto del matraz sobre la curva (reto)
    if (reto) {
      const xp = v.hervidor.x;
      ctx.fillStyle = cssComposicion(xp); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(X(xp), Y(m.yEq(xp)), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  };

  // ── perfil por etapa ──
  const dibujarPerfil = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const f = familia();
    const filas = N_PLATOS + 2;
    const fh = h / filas;
    const lx = 58, rx = 52;
    const bw = Math.max(20, w - lx - rx - 46);
    for (let i = 0; i < filas; i++) {
      const y = i * fh, cy = y + fh / 2;
      const res = i === r.etapaResaltada && escalera;
      if (res) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, y + 1, w, fh - 2); }
      ctx.fillStyle = res ? '#ffffff' : '#94a3b8'; ctx.font = `${res ? 700 : 600} 10px ${f}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(NOMBRE_ETAPA(i), 2, cy);
      // barra: el líquido de la etapa (longitud = x, color = código)
      const x = v.x[i] ?? 0;
      ctx.fillStyle = 'rgba(148,163,184,0.12)'; ctx.fillRect(lx, cy - 4, bw, 8);
      if (v.nivel[i] > 0.05 || i === N_PLATOS + 1) {
        ctx.fillStyle = cssComposicion(x);
        ctx.fillRect(lx, cy - 4, escalera ? bw * x : bw, 8);
      }
      ctx.font = `500 10px ${f}`;
      if (escalera) { ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left'; ctx.fillText(cifra(x, 3), lx + bw + 6, cy); }
      ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'right';
      ctx.fillText(`${cifra(v.T[i], 1)} °C`, w - 2, cy);
    }
  };

  // ── reto: temperatura de cabeza frente al destilado ──
  const hist = r.historia;
  const vMaxH = Math.max(60, Math.ceil(((hist[hist.length - 1]?.v ?? 0) + 10) / 20) * 20);
  const dibujarHistoria = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const f = familia();
    const ml = 30, mr = 8, mt = 8, mb = 18;
    const T0 = 70, T1 = 100;
    const X = (vv: number) => ml + (vv / vMaxH) * (w - ml - mr);
    const Y = (T: number) => h - mb - ((Math.max(T0, Math.min(T1, T)) - T0) / (T1 - T0)) * (h - mt - mb);
    ctx.strokeStyle = 'rgba(148,163,184,0.12)'; ctx.lineWidth = 1;
    for (let T = T0; T <= T1; T += 10) { ctx.beginPath(); ctx.moveTo(ml, Math.round(Y(T)) + 0.5); ctx.lineTo(w - mr, Math.round(Y(T)) + 0.5); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.beginPath(); ctx.moveTo(ml + 0.5, mt); ctx.lineTo(ml + 0.5, h - mb + 0.5); ctx.lineTo(w - mr, h - mb + 0.5); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = `500 10px ${f}`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const T of [70, 85, 100]) ctx.fillText(String(T), ml - 4, Y(T));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let vv = 0; vv <= vMaxH; vv += vMaxH > 100 ? 40 : 20) ctx.fillText(String(vv), X(vv), h - mb + 3);
    ctx.font = `600 10px ${f}`; ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('T cabeza (°C)', ml + 4, mt);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('destilado (mL)', w - mr, h - mb - 3);
    if (hist.length > 1) {
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); hist.forEach((p, i) => (i ? ctx.lineTo(X(p.v), Y(p.T)) : ctx.moveTo(X(p.v), Y(p.T)))); ctx.stroke();
    }
    const u = hist[hist.length - 1];
    if (u) { ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(u.v), Y(u.T), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  };

  // ── cifras ──
  const refs = r.referencias;
  const cifras: { k: string; v: string; u?: string; t: string }[] = reto
    ? [
      { k: 'T cabeza', v: cifra(v.tCabeza, 1), u: '°C', t: 'Pt100 en el vapor que llega al condensador' },
      { k: 'T matraz', v: cifra(v.hervidor.T, 1), u: '°C', t: 'Temperatura del líquido del hervidor' },
      ...(revela && r.perfil ? [
        { k: 'Etapas', v: cifra(r.perfil.Nef, 2), t: 'Etapas teóricas efectivas (matraz incluido) con el caudal de la última lectura' },
        { k: 'Eficiencia', v: `${cifra(r.perfil.eficiencia * 100, 0)} %`, t: 'Eficiencia global de los 5 platos: (N_ef − 1)/5' },
      ] : []),
    ]
    : [
      { k: 'T cabeza', v: cifra(v.tCabeza, 1), u: '°C', t: 'Pt100: temperatura de rocío del vapor del plato 1' },
      { k: 'x_D', v: cifra(xD, 3), t: `Fracción molar de ${ligero} en el destilado` },
      { k: 'x_B', v: cifra(xB, 3), t: `Fracción molar de ${ligero} en el fondo` },
      { k: 'D', v: total ? '0' : cifra(r.destiladoMLmin, 2), u: 'mL/min', t: 'Caudal de destilado' },
      { k: 'R_min', v: cifra(refs.Rmin, 2), t: m.alfa ? `Reflujo mínimo para este x_D (Underwood ${cifra(refs.underwood ?? NaN, 2)})` : 'Reflujo mínimo: pellizco tangente a la curva real' },
      ...(m.alfa && refs.Nmin !== null ? [{ k: 'N_min', v: cifra(refs.Nmin, 2), t: 'Etapas mínimas (Fenske, reflujo total) para estos x_D y x_B' }] : []),
    ];

  const seccionCifras = (
    <div className="grid grid-cols-3 gap-1.5" data-instrumento="cifras">
      {cifras.map((c) => (
        <div key={c.k} title={c.t} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
          <div className="flex items-baseline justify-between gap-1 whitespace-nowrap text-[10px] font-semibold text-slate-400"><span>{c.k}</span>{c.u && <span className="text-[9px] font-medium text-slate-500">{c.u}</span>}</div>
          <div className="font-mono text-[13px] font-semibold tabular-nums leading-tight text-white">{c.v}</div>
        </div>
      ))}
    </div>
  );

  const leyenda = (
    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400" title="Los dos líquidos son incoloros: el color es un código de composición">
      <span>{m.pesado}</span>
      <i className="block h-1.5 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${cssComposicion(0)}, ${cssComposicion(0.5)}, ${cssComposicion(1)})` }} />
      <span>{ligero}</span>
    </div>
  );

  const seccionDiagrama = (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5" data-instrumento="mccabe">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">McCabe–Thiele</span>
        <span className="font-mono text-[10px] text-slate-300">
          {reto ? (revela ? `R = ${R_RETO}` : 'equilibrio') : total ? 'R total' : `R = ${cifra(R, 1)}`}
        </span>
      </div>
      <Lienzo alto={altoDiag} dibujar={dibujarXY} deps={[tick, revela, modo, m.id, total]} etiqueta="Diagrama x–y: curva de equilibrio, rectas de operación y escalera de la columna" />
      {leyenda}
    </section>
  );

  const seccionPerfil = (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5" data-instrumento="perfil">
      <Lienzo alto={7 * 17} dibujar={dibujarPerfil} deps={[tick, revela, modo]} etiqueta="Composición y temperatura de cada etapa, de la cabeza al hervidor" />
    </section>
  );

  const seccionHistoria = reto ? (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5" data-instrumento="historia">
      <Lienzo alto={110} dibujar={dibujarHistoria} deps={[tick, hist.length, vMaxH]} etiqueta="Temperatura de cabeza frente al destilado recogido" />
    </section>
  ) : null;

  const modelo = (
    <section className="space-y-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-slate-300" data-instrumento="modelo">
      <ul className="space-y-0.5 font-mono text-[10.5px] leading-snug text-slate-200">
        <li>y = αx/(1 + (α − 1)x){m.alfa ? `, α = ${cifra(m.alfa, 2)} (Raoult + Antoine)` : ' (tabla real)'}</li>
        <li>rectificación: y = R/(R+1)·x + x_D/(R+1)</li>
        <li>agotamiento: y = (L′/V′)·x − B·x_B/V′ · q = 1</li>
        <li>Fenske: N_min = ln[x_D(1−x_B)/((1−x_D)x_B)]/ln α</li>
        <li>R_min: Underwood · pellizco con la curva</li>
        <li>M·dxₙ/dt = Lxₙ₋₁ + Vyₙ₊₁ − Lxₙ − Vyₙ</li>
      </ul>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
      <ul className="list-disc space-y-0.5 pl-4 leading-snug">
        <li>Platos ideales, derrame molar constante, 1 atm.</li>
        <li>Hexano–heptano: α constante; etanol–agua: tabla real, con azeótropo.</li>
        <li>Composición en cámara rápida; burbujas y gotas, ilustrativas.</li>
        <li>El color es un código: ambos líquidos son incoloros.</li>
        <li>Reto: N_ef = 1 + 3·e^(−q/1,5) del lab, repartidas en los 5 platos; divisor dibujado a 4 : 1.</li>
      </ul>
      {docente && (
        <p className="border-t border-white/10 pt-1.5 italic leading-snug text-slate-300" data-docente="">
          La mezcla 1:1 del reto hierve hacia 83 °C. Con la manta apenas por encima de la ebullición la columna trabaja casi a reflujo y el destilado supera el 85 % v/v; a fondo, la columna se inunda y sale más aguado.
        </p>
      )}
    </section>
  );

  const pestanas: { k: Pestana; t: string }[] = apilado
    ? [{ k: 'diagrama', t: 'Medidas' }, { k: 'modelo', t: 'Modelo' }]
    : [{ k: 'diagrama', t: 'Diagrama' }, { k: 'perfil', t: reto ? 'Cabeza' : 'Perfil' }, { k: 'modelo', t: 'Modelo' }];

  const cuerpoMedidas = reto
    ? (apilado ? (<>{seccionCifras}{seccionHistoria}{seccionPerfil}{seccionDiagrama}</>) : vista === 'perfil' ? (<>{seccionCifras}{seccionHistoria}{seccionPerfil}</>) : seccionDiagrama)
    : (apilado ? (<>{seccionCifras}{seccionDiagrama}{seccionPerfil}</>) : vista === 'perfil' ? (<>{seccionCifras}{seccionPerfil}</>) : seccionDiagrama);

  return (
    <div ref={raiz} className="space-y-2" data-dock="destilacion" data-tick={tick} data-apilado={apilado ? '1' : '0'}>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="tablist">
        {pestanas.map((p) => (
          <button key={p.k} type="button" role="tab" aria-selected={vista === p.k} onClick={() => setPestana(p.k)}
            className={`h-6 flex-1 rounded-md text-[11px] font-semibold ${vista === p.k ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {p.t}
          </button>
        ))}
      </div>
      {vista === 'modelo' ? modelo : cuerpoMedidas}
      {pie}
    </div>
  );
}
