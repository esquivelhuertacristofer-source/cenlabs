'use client';
/**
 * qmi07/Dock.tsx — los instrumentos de la titulación en DOM nítido (lienzos a
 * devicePixelRatio). Lee el MISMO reloj que la escena (`RelojTitulacion`): cifras, curva,
 * aguja del pH-metro 3D y color del matraz salen del mismo cuadro.
 *
 *  - pH-metro: pH, potencial del electrodo E = −S·(pH − 7) y temperatura.
 *  - Indicador: la escala de pH pintada con el color REAL que da Beer–Lambert a cada pH
 *    (HIn ⇌ H⁺ + In⁻), su intervalo de viraje y la fracción In⁻ de ahora.
 *  - Curva: pH frente a V de NaOH con el punto de operación y la derivada ΔpH/ΔV (el pico
 *    marca el equivalente). El trazo lleva el color que tenía el matraz en cada lectura.
 *
 * NO REGALAR. En el reto, antes de validar, la curva sólo muestra lo medido: ni la línea
 * del equivalente, ni la curva teórica, ni la concentración. En la exploración (ácido
 * conocido) el equivalente y la semiequivalencia se rotulan cuando la curva ya pasó por ellos.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ACIDOS, INDICADORES, PENDIENTE_NERNST, T_C, V_GOTA_ML, Q_CHORRO, T_VACIADO_S, N_TAU,
  derivada, curva, transmitancia, aSRGB, volumenEquivalencia, protones, kbConjugada, esFuerte,
  type Sistema, type IdIndicador, type RGB,
} from './acidobase';
import type { RelojTitulacion } from './reloj';

// ───────────────────────────── formato (coma decimal) ─────────────────────────────

const MENOS = '−';
/** Cifra con `d` decimales y coma decimal (signo menos tipográfico). */
export function cifra(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const cero = Number(abs) === 0;
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + abs.replace('.', ',');
}
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
/** 1,8·10⁻⁵ */
export function cientifica(x: number, d = 1): string {
  if (!(x > 0)) return '0';
  const e = Math.floor(Math.log10(x));
  const m = x / 10 ** e;
  return `${cifra(m, d)}·10${String(e).split('').map((ch) => SUP[ch] ?? ch).join('')}`;
}

// ───────────────────────────── reloj → React ─────────────────────────────

/** Re-render a ≤ `hz` cuando el reloj integra un cuadro nuevo (o cambia de reloj). */
export function useTickReloj(reloj: React.MutableRefObject<RelojTitulacion>, hz = 24): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, ultimoR: RelojTitulacion | null = null, t0 = 0;
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

/** Color sRGB del matraz (6 cm de disolución) para un pH con el indicador y su concentración. */
function colorEn(id: IdIndicador | null, cIn: number, ph: number): [number, number, number] {
  if (!id || cIn <= 0) return [226, 232, 240];
  return aSRGB(transmitancia(INDICADORES[id], cIn, ph, 6));
}
const rgb = (c: [number, number, number], a = 1) => (a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);
/** El blanco del indicador incoloro se vería como «nada» en el fondo oscuro: piso de luminancia. */
const visible = (c: [number, number, number]): [number, number, number] => {
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return L < 70 ? (c.map((x) => Math.round(x + (70 - L) * 0.8)) as [number, number, number]) : c;
};

// ───────────────────────────── dock ─────────────────────────────

export interface DockTitulacionProps {
  reloj: React.MutableRefObject<RelojTitulacion>;
  modo: 'explorar' | 'reto';
  /** reto validado: ya se pueden dibujar el equivalente, la curva teórica y la concentración */
  revela: boolean;
  /** el sistema verdadero del reto (sólo se usa si `revela`) */
  sistemaReal?: Sistema;
  pie?: React.ReactNode;
}

type Pestana = 'curva' | 'medidor' | 'modelo';
/** la derivada en gris neutro: no se confunde con ningún color de indicador */
const COL_DER = '#cbd5e1';
const ALTO_CURVA_MAX = 330, ALTO_CURVA_MIN = 150;
/** Por debajo de este alto útil el dock pasa a pestañas (una sección a la vez). */
const ALTO_APILADO = 470;

export function DockTitulacion({ reloj, modo, revela, sistemaReal, pie }: DockTitulacionProps) {
  const tick = useTickReloj(reloj);
  const r = reloj.current;
  const l = r.lectura, s = r.sistema;
  const id = r.indicador;
  const ind = id ? INDICADORES[id] : null;
  const acido = ACIDOS[s.acido];

  // ── alto disponible: apilado o pestañas, y el alto de la curva ──
  const raiz = useRef<HTMLDivElement>(null);
  const [util, setUtil] = useState(800);
  const [altoCurva, setAltoCurva] = useState(220);
  const altoActual = useRef(220);
  const apilado = util >= ALTO_APILADO;
  const [pestana, setPestana] = useState<Pestana>('curva');
  const vista: Pestana = apilado && pestana === 'medidor' ? 'curva' : pestana;
  useLayoutEffect(() => {
    const el = raiz.current, caja = el?.parentElement;
    if (!el || !caja) return;
    const ajustar = () => {
      const cs = getComputedStyle(caja);
      const u = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      setUtil(u);
      const resto = el.scrollHeight - altoActual.current;
      // la curva no pasa de ~1,15 veces su ancho (más alta se leería como una columna)
      const tope = Math.min(ALTO_CURVA_MAX, Math.round(el.clientWidth * 1.15));
      const hh = Math.max(ALTO_CURVA_MIN, Math.min(tope, Math.floor(u - resto - 2)));
      if (hh !== altoActual.current) { altoActual.current = hh; setAltoCurva(hh); }
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(caja); ro.observe(el);
    ajustar();
    return () => ro.disconnect();
  }, [apilado, vista]);

  // ── la curva ──
  const hist = r.historia;
  const vEqs = useMemo(() => {
    const out: number[] = [];
    for (let j = 1; j <= protones(s.acido); j++) out.push(volumenEquivalencia(s, j));
    return out;
  }, [s]);
  // eje x: en la exploración, hasta donde llega el titulador; en el reto crece con lo añadido (no delata nada)
  const vFinExpl = Math.min(50, Math.ceil((r.vEqUltimo + 7) / 5) * 5);
  const xMax = modo === 'explorar' ? vFinExpl : Math.min(50, Math.max(10, Math.ceil((r.vbSalida + 4) / 5) * 5));
  const teorica = useMemo(() => (revela && sistemaReal ? curva({ ...sistemaReal, vAgua: s.vAgua }, 50, 500) : null), [revela, sistemaReal, s.vAgua]);
  const cRef = l.cIn > 0 ? l.cIn : 0;
  const dibujarCurva = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const f = familia();
    const m = { l: 26, r: 30, t: 10, b: 20 };
    const X = (v: number) => m.l + (v / xMax) * (w - m.l - m.r);
    const Y = (ph: number) => h - m.b - (ph / 14) * (h - m.t - m.b);
    // banda de viraje del indicador (propiedad de tabla, no delata el equivalente)
    if (ind) {
      const c = colorEn(id, Math.max(cRef, 1e-5), (ind.rango[0] + ind.rango[1]) / 2);
      ctx.fillStyle = rgb(visible(c), 0.16);
      ctx.fillRect(m.l, Y(ind.rango[1]), w - m.l - m.r, Y(ind.rango[0]) - Y(ind.rango[1]));
    }
    // rejilla y ejes
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148,163,184,0.13)';
    const pasoX = xMax <= 10 ? 2 : xMax <= 25 ? 5 : 10;
    for (let v = 0; v <= xMax + 1e-9; v += pasoX) { ctx.beginPath(); ctx.moveTo(Math.round(X(v)) + 0.5, m.t); ctx.lineTo(Math.round(X(v)) + 0.5, h - m.b); ctx.stroke(); }
    for (let p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(p)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(p)) + 0.5); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = `500 10px ${f}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = 0; v <= xMax + 1e-9; v += pasoX) ctx.fillText(String(v), X(v), h - m.b + 4);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let p = 0; p <= 14; p += 7) ctx.fillText(String(p), m.l - 5, Y(p));
    ctx.font = `600 10px ${f}`; ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('pH', m.l + 4, m.t);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('V NaOH (mL)', w - m.r, h - m.b - 3);
    // derivada ΔpH/ΔV (área en el eje derecho)
    const d = derivada(hist);
    if (d.length > 1) {
      let dMax = 1;
      for (const q of d) if (q.v <= xMax && q.d > dMax) dMax = q.d;
      dMax *= 1.08;
      const Yd = (x: number) => h - m.b - (Math.max(0, x) / dMax) * (h - m.t - m.b);
      ctx.beginPath(); ctx.moveTo(X(d[0].v), h - m.b);
      for (const q of d) if (q.v <= xMax) ctx.lineTo(X(q.v), Yd(q.d));
      ctx.lineTo(X(Math.min(xMax, d[d.length - 1].v)), h - m.b); ctx.closePath();
      ctx.fillStyle = 'rgba(203,213,225,0.10)'; ctx.fill();
      ctx.beginPath();
      d.forEach((q, i) => { if (q.v > xMax) return; if (i) ctx.lineTo(X(q.v), Yd(q.d)); else ctx.moveTo(X(q.v), Yd(q.d)); });
      ctx.strokeStyle = 'rgba(203,213,225,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = COL_DER; ctx.font = `500 10px ${f}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(cifra(dMax / 1.08, dMax > 20 ? 0 : 1), w - m.r + 4, Yd(dMax / 1.08));
      ctx.fillText('0', w - m.r + 4, h - m.b);
    }
    ctx.fillStyle = COL_DER; ctx.font = `600 10px ${f}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('ΔpH/ΔV', w - 2, m.t);
    // curva teórica del reto, sólo tras validar
    if (teorica) {
      ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(226,232,240,0.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      teorica.forEach((p, i) => { if (p.v > xMax) return; if (i) ctx.lineTo(X(p.v), Y(p.ph)); else ctx.moveTo(X(p.v), Y(p.ph)); });
      ctx.stroke(); ctx.setLineDash([]);
    }
    // rótulos del equivalente: exploración cuando ya se pasó; reto sólo validado
    const marcarEq = (v: number, texto: string) => {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(52,211,153,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(X(v)) + 0.5, m.t + 12); ctx.lineTo(Math.round(X(v)) + 0.5, h - m.b); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#6ee7b7'; ctx.font = `700 10px ${f}`; ctx.textBaseline = 'top';
      ctx.textAlign = X(v) > w - 70 ? 'right' : 'left';
      ctx.fillText(texto, X(v) + (X(v) > w - 70 ? -3 : 3), m.t + 12);
    };
    if (modo === 'explorar') {
      vEqs.forEach((v, j) => {
        if (v <= xMax && r.vb >= v + 0.3) marcarEq(v, `${vEqs.length > 1 ? `V${j + 1}` : 'V_eq'} ${cifra(v, 2)}`);
      });
      // semiequivalencia de los débiles: pH = pKa
      acido.pKa.forEach((pKa, j) => {
        const vS = j === 0 ? vEqs[0] / 2 : (vEqs[j - 1] + (vEqs[j] ?? 2 * vEqs[j - 1])) / 2;
        if (vS > xMax || r.vb < vS + 0.3 || pKa > 11) return;
        const phS = hist.length ? interp(hist, vS) : pKa;
        ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(vS), Y(phS), 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = `700 10px ${f}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(`pKa${acido.pKa.length > 1 ? j + 1 : ''} ${cifra(pKa, 2)}`, X(vS) + 5, Y(phS) - 3);
      });
    } else if (revela && sistemaReal) {
      marcarEq(volumenEquivalencia(sistemaReal), `V_eq ${cifra(volumenEquivalencia(sistemaReal), 2)}`);
    }
    // la curva medida, con el color que tenía el matraz en cada lectura
    if (hist.length > 1) {
      ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (let i = 1; i < hist.length; i++) {
        const a = hist[i - 1], b = hist[i];
        if (a.v > xMax) break;
        ctx.strokeStyle = rgb(visible(colorEn(id, cRef, (a.ph + b.ph) / 2)));
        ctx.beginPath(); ctx.moveTo(X(a.v), Y(a.ph)); ctx.lineTo(X(Math.min(b.v, xMax)), Y(b.ph)); ctx.stroke();
      }
    }
    // punto de operación
    const xo = X(Math.min(r.vb, xMax)), yo = Y(l.ph);
    ctx.fillStyle = rgb(visible(colorEn(id, cRef, l.ph))); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(xo, yo, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  };

  // ── la escala del indicador ──
  const dibujarEscala = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const f = familia();
    const m = 6, y0 = 4, hb = h - 18;
    const X = (ph: number) => m + (ph / 14) * (w - 2 * m);
    if (!ind) {
      ctx.fillStyle = 'rgba(148,163,184,0.12)'; ctx.fillRect(m, y0, w - 2 * m, hb);
    } else {
      const c = Math.max(cRef, 1e-5);
      for (let i = 0; i < w - 2 * m; i++) {
        const ph = (i / (w - 2 * m)) * 14;
        ctx.fillStyle = rgb(colorEn(id, c, ph));
        ctx.fillRect(m + i, y0, 1.5, hb);
      }
      // intervalo de viraje
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
      const xa = X(ind.rango[0]), xb = X(ind.rango[1]);
      ctx.beginPath(); ctx.moveTo(xa, y0 + hb + 2); ctx.lineTo(xa, y0 + hb + 6); ctx.lineTo(xb, y0 + hb + 6); ctx.lineTo(xb, y0 + hb + 2); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(m + 0.5, y0 + 0.5, w - 2 * m - 1, hb - 1);
    ctx.fillStyle = '#94a3b8'; ctx.font = `500 10px ${f}`; ctx.textBaseline = 'top';
    for (const p of [0, 7, 14]) { ctx.textAlign = p === 0 ? 'left' : p === 14 ? 'right' : 'center'; ctx.fillText(String(p), X(p), y0 + hb + 4); }
    // marcador del pH de ahora
    const xp = X(Math.max(0, Math.min(14, l.ph)));
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xp, y0 + 6); ctx.lineTo(xp - 5, y0 - 3); ctx.lineTo(xp + 5, y0 - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(xp - 0.75, y0, 1.5, hb);
  };

  const colorMatraz = rgb(aSRGB(l.T6 as RGB));
  const fIn = l.fIn;

  const medidor = (
    <div className="space-y-2">
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5" data-instrumento="phmetro">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">pH-metro</span>
          <span className="font-mono text-[10px] text-slate-400">{cifra(T_C, 1)} °C</span>
        </div>
        <div className="flex items-center justify-between gap-2 font-mono tabular-nums">
          <span className="text-[26px] font-semibold leading-none text-white" data-lectura="ph">{cifra(l.ph, 2)}<span className="ml-1 text-[12px] text-slate-400">pH</span></span>
          <span className="text-right text-[11px] leading-tight text-slate-300">
            <span className="block">{cifra(l.mV, 0, true)} mV</span>
            <span className="mt-1 flex items-center justify-end gap-1.5 text-slate-400">matraz<i className="block h-3 w-3 rounded-full border border-white/25" style={{ background: colorMatraz }} data-color-matraz={colorMatraz} /></span>
          </span>
        </div>
      </section>
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5" data-instrumento="indicador">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold text-slate-300">{ind ? ind.nombre : 'Sin indicador'}</span>
          {ind && fIn !== null && <span className="whitespace-nowrap font-mono text-[10px] text-slate-300" title="Fracción del indicador en su forma básica In⁻">In⁻ {cifra(fIn * 100, fIn < 0.1 || fIn > 0.9 ? 1 : 0)} %</span>}
        </div>
        <Lienzo alto={40} dibujar={dibujarEscala} deps={[tick, id]} etiqueta="Color del indicador a cada pH, su intervalo de viraje y el pH de ahora" />
      </section>
    </div>
  );

  const seccionCurva = (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5" data-instrumento="curva">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Curva de valoración</span>
        {revela && sistemaReal && <span className="font-mono text-[10px] font-semibold text-emerald-300" data-revelado="">[HCl] {cifra(sistemaReal.ca, 3)} M</span>}
      </div>
      <Lienzo alto={altoCurva} dibujar={dibujarCurva} deps={[tick, revela, xMax, id, modo]} etiqueta="pH del matraz frente al volumen de NaOH añadido, con la derivada" />
    </section>
  );

  const pkas = acido.pKa;
  const vEq1 = vEqs[0];
  const modelo = (
    <section className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-slate-300" data-instrumento="modelo">
      <ul className="space-y-1 font-mono text-[11px] leading-snug text-slate-200">
        <li>[H⁺] + [Na⁺] = [OH⁻] + Σ j·[HₙA]ʲ⁻ (balance de carga, se resuelve exacto)</li>
        <li>Kw = 10⁻¹⁴ · {pkas.length ? `pKa ${pkas.map((p) => cifra(p, 2)).join(' · ')}` : 'HCl: [Cl⁻] = C_A'}</li>
        {!esFuerte(s.acido) && <li>Kb(A⁻) = Kw/Ka = {cientifica(kbConjugada(s.acido, 1))}</li>}
        <li>f(In⁻) = 1/(1 + 10^(pK_In − pH)) · T = 10^(−ε·c·ℓ)</li>
        <li>E = −{cifra(PENDIENTE_NERNST * 1000, 2)} mV·(pH − 7)</li>
        <li>gota (Tate) = {cifra(V_GOTA_ML, 3)} mL · chorro &gt; {cifra(Q_CHORRO, 2)} mL/s</li>
      </ul>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué simplifica</p>
      <ul className="list-disc space-y-1 pl-4 leading-snug">
        <li>Actividades = concentraciones, 25 °C, sin CO₂ disuelto.</li>
        <li>{cifra(s.va, 0)} mL de muestra + {cifra(s.vAgua, 0)} mL de agua para cubrir el bulbo (no cambia los moles).</li>
        <li>Electrodo ideal, sin deriva; la aguja tarda como una bobina real.</li>
        <li>Mezcla: V_e = v·(e^(t/τ) − 1), N·τ = {cifra(N_TAU, 1)}; la estela es una nube gaussiana.</li>
        <li>Bureta clase A: se vacía en {T_VACIADO_S} s con la llave abierta.</li>
        <li>El indicador no altera el pH (≈ 10⁻⁵ M).</li>
        {modo === 'explorar' && <li>Titulador automático: más rápido donde el pH apenas cambia. 1 equivalente ≈ {cifra(vEq1, 2)} mL.</li>}
      </ul>
    </section>
  );

  const pestanas: { k: Pestana; t: string }[] = apilado
    ? [{ k: 'curva', t: 'Medidas' }, { k: 'modelo', t: 'Modelo' }]
    : [{ k: 'curva', t: 'Curva' }, { k: 'medidor', t: 'Medidor' }, { k: 'modelo', t: 'Modelo' }];

  return (
    <div ref={raiz} className="space-y-2" data-dock="titulacion" data-tick={tick} data-apilado={apilado ? '1' : '0'}>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="tablist">
        {pestanas.map((p) => (
          <button key={p.k} type="button" role="tab" aria-selected={vista === p.k} onClick={() => setPestana(p.k)}
            className={`h-6 flex-1 rounded-md text-[11px] font-semibold ${vista === p.k ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {p.t}
          </button>
        ))}
      </div>
      {vista === 'modelo' ? modelo : apilado ? (<>{medidor}{seccionCurva}</>) : vista === 'medidor' ? medidor : seccionCurva}
      {pie}
    </div>
  );
}

/** pH interpolado en las lecturas a un volumen. */
function interp(p: { v: number; ph: number }[], v: number): number {
  if (v <= p[0].v) return p[0].ph;
  for (let i = 1; i < p.length; i++) {
    if (p[i].v >= v) {
      const a = p[i - 1], b = p[i];
      return b.v - a.v < 1e-12 ? b.ph : a.ph + ((b.ph - a.ph) * (v - a.v)) / (b.v - a.v);
    }
  }
  return p[p.length - 1].ph;
}
