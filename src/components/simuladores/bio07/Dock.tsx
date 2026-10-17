'use client';
/**
 * bio07/Dock.tsx — el dock DOM bajo la escena, dibujado en lienzos 2D a devicePixelRatio
 * (texto y trazas nítidos). Lee EL MISMO reloj que la escena: se redibuja cuando el reloj
 * avisa, una vez por cuadro.
 *
 *  · Banco (modo Neurona): mandos de la fibra y del estímulo; V(t) del soma (pipeta A) y
 *    del nodo B, y las corrientes I_Na e I_K de HH en el soma; v = Δx/Δt entre el primer
 *    nodo y el de la pipeta B.
 *  · Arco reflejo: EMG del cuádriceps con el cronograma del arco en el mismo eje de tiempo
 *    (aferente, sinapsis 0,7 ms, eferente, placa 0,8 ms) y el registro intracelular de la
 *    motoneurona α (V, I_Na, I_K). La conducción de cada tramo y v sólo se escriben después
 *    de validar: antes, «?».
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { DIAMETROS, DUR_ESTIMULO, type ConfigBanco } from './banco';
import { emg, ventanaEMG } from './arco';
import type { RelojArco, RelojBanco } from './reloj';
import type { TipoFibra } from './neuro';

// ───────────────────────────── utilidades ─────────────────────────────

/** Número con coma decimal y espacio fino de millares (es-MX formatea a la inglesa). */
export function num(x: number, dec = 1): string {
  const s = Math.abs(x).toFixed(dec);
  const [e, d] = s.split('.');
  const ent = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${x < 0 ? '−' : ''}${ent}${d ? ',' + d : ''}`;
}

function useTamano<T extends HTMLElement>(): [React.RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [t, setT] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setT({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, t];
}

function preparar(cv: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d');
  if (!g) return null;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#0a1220'; g.fillRect(0, 0, w, h);
  return g;
}

const FUENTE = (px: number, peso = 500) => `${peso} ${px}px Outfit, system-ui, sans-serif`;
const COL = { rejilla: 'rgba(148,180,205,0.13)', eje: 'rgba(170,196,214,0.62)', texto: 'rgba(214,228,240,0.86)', tenue: 'rgba(170,196,214,0.5)' };

/** Paso «bonito» para ~n marcas en un rango. */
function pasoBonito(rango: number, n = 6) {
  const bruto = rango / n;
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto) return k * p;
  return 10 * p;
}

interface Panel { x0: number; x1: number; y0: number; y1: number; t0: number; t1: number; v0: number; v1: number }
const px = (p: Panel, t: number) => p.x0 + ((t - p.t0) / (p.t1 - p.t0)) * (p.x1 - p.x0);
const py = (p: Panel, v: number) => p.y1 - ((v - p.v0) / (p.v1 - p.v0)) * (p.y1 - p.y0);

function ejes(g: CanvasRenderingContext2D, p: Panel, marcasV: number[], etiquetaV: string, marcasT: boolean, decT = 1) {
  g.strokeStyle = COL.rejilla; g.lineWidth = 1;
  g.beginPath();
  for (const v of marcasV) { const y = Math.round(py(p, v)) + 0.5; g.moveTo(p.x0, y); g.lineTo(p.x1, y); }
  const paso = pasoBonito(p.t1 - p.t0, Math.max(3, Math.round((p.x1 - p.x0) / 70)));
  for (let t = Math.ceil(p.t0 / paso) * paso; t <= p.t1 + 1e-9; t += paso) { const x = Math.round(px(p, t)) + 0.5; g.moveTo(x, p.y0); g.lineTo(x, p.y1); }
  g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const v of marcasV) g.fillText(num(v, 0), p.x0 - 4, py(p, v));
  g.save(); g.translate(9, (p.y0 + p.y1) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText(etiquetaV, 0, 0); g.restore();
  if (marcasT) {
    g.textAlign = 'center'; g.textBaseline = 'top';
    const dec = paso < 1 ? (paso < 0.1 ? 2 : decT) : 0;
    for (let t = Math.ceil(p.t0 / paso) * paso; t <= p.t1 + 1e-9; t += paso) {
      const x = px(p, t);
      if (x > p.x1 - 20) continue; // deja sitio a la unidad
      g.fillText(num(t, dec), x, p.y1 + 2);
    }
    g.textAlign = 'right'; g.fillText('ms', p.x1, p.y1 + 2);
  }
}

function traza(g: CanvasRenderingContext2D, p: Panel, n: number, tDe: (k: number) => number, vDe: (k: number) => number, color: string, ancho = 1.6) {
  if (n < 2) return;
  g.save();
  g.beginPath(); g.rect(p.x0, p.y0 - 2, p.x1 - p.x0, p.y1 - p.y0 + 4); g.clip();
  g.strokeStyle = color; g.lineWidth = ancho; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath();
  for (let k = 0; k < n; k++) { const x = px(p, tDe(k)), y = py(p, vDe(k)); if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.stroke();
  g.restore();
}

function leyenda(g: CanvasRenderingContext2D, x: number, y: number, items: [string, string][]) {
  g.font = FUENTE(10, 600); g.textBaseline = 'middle'; g.textAlign = 'left';
  let cx = x;
  for (const [t, c] of items) {
    g.fillStyle = c; g.fillRect(cx, y - 1, 12, 2.5);
    g.fillStyle = COL.texto; g.fillText(t, cx + 16, y);
    cx += 22 + g.measureText(t).width;
  }
  return cx;
}

/** Escala simétrica «bonita» para las corrientes. */
const escalaI = (m: number) => { for (const s of [0.25, 0.5, 1, 2, 4, 8, 16]) if (m <= s) return s; return 32; };

// ───────────────────────────── banco ─────────────────────────────

function dibujarBanco(cv: HTMLCanvasElement, w: number, h: number, r: RelojBanco) {
  const g = preparar(cv, w, h); if (!g) return;
  const b = r.banco;
  const izq = 40, der = 10, arriba = 22, abajo = 15, sep = 8;
  const alto = h - arriba - abajo - sep;
  const hV = Math.round(alto * 0.62);
  const T = b.durBarrido;
  const pV: Panel = { x0: izq, x1: w - der, y0: arriba, y1: arriba + hV, t0: 0, t1: T, v0: -90, v1: 50 };
  const pI: Panel = { x0: izq, x1: w - der, y0: arriba + hV + sep, y1: h - abajo, t0: 0, t1: T, v0: -1, v1: 1 };
  // escala de corrientes: la del máximo del barrido
  let m = 0;
  for (let k = 0; k < b.muestras; k++) m = Math.max(m, Math.abs(b.INaA[k]), Math.abs(b.IKA[k]));
  const sI = escalaI(m);
  pI.v0 = -sI; pI.v1 = sI;
  ejes(g, pV, [-80, -40, 0, 40], 'mV', false);
  ejes(g, pI, [-sI, 0, sI], 'mA/cm²', true, 1);
  // reposo
  g.setLineDash([3, 4]); g.strokeStyle = 'rgba(170,196,214,0.28)'; g.beginPath(); g.moveTo(pV.x0, Math.round(py(pV, -65)) + 0.5); g.lineTo(pV.x1, Math.round(py(pV, -65)) + 0.5); g.stroke(); g.setLineDash([]);
  // pulsos de estímulo
  for (const p0 of b.pulsos) {
    const x0 = px(pV, p0), x1 = Math.max(x0 + 2, px(pV, p0 + DUR_ESTIMULO));
    g.fillStyle = 'rgba(159,232,255,0.13)'; g.fillRect(x0, pV.y0, x1 - x0, pV.y1 - pV.y0);
    g.fillStyle = '#9fe8ff'; g.beginPath(); g.moveTo(x0, pV.y0); g.lineTo(x0 + 4, pV.y0 - 6); g.lineTo(x0 - 4, pV.y0 - 6); g.closePath(); g.fill();
  }
  const dt = 0.005;
  traza(g, pI, b.muestras, (k) => k * dt, (k) => b.IKA[k], '#b48cff', 1.4);
  traza(g, pI, b.muestras, (k) => k * dt, (k) => b.INaA[k], '#ffb050', 1.4);
  traza(g, pV, b.muestras, (k) => k * dt, (k) => b.VB[k], '#ffc35a', 1.7);
  traza(g, pV, b.muestras, (k) => k * dt, (k) => b.VA[k], '#7fd7ff', 1.7);
  // cursor: el instante de la escena
  if (b.t0Barrido >= 0) {
    const s = b.cable.t - b.t0Barrido;
    if (s <= T) {
      const x = Math.round(px(pV, s)) + 0.5;
      g.strokeStyle = 'rgba(255,214,140,0.45)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, pV.y0); g.lineTo(x, pI.y1); g.stroke();
    }
  }
  // leyenda y lectura de v (si no cabe entera, sólo v)
  const finLeyenda = leyenda(g, izq, 9, [['A soma', '#7fd7ff'], ['B nodo', '#ffc35a'], ['I_Na', '#ffb050'], ['I_K', '#b48cff']]);
  g.font = FUENTE(10.5, 600); g.textAlign = 'right'; g.textBaseline = 'middle';
  const c = b.cable;
  const opciones: string[] = [];
  if (b.vMedida !== null) {
    const dx = c.x[b.iB] - c.x[b.iN1], dtc = c.tCruce[b.iB] - c.tCruce[b.iN1];
    opciones.push(`v = ${num(dx, 2)} mm / ${num(dtc, 3)} ms = ${num(b.vMedida, 1)} m/s`, `v = ${num(b.vMedida, 1)} m/s`);
    g.fillStyle = '#ffe3a6';
  } else { opciones.push('HH · 18,5 °C'); g.fillStyle = COL.tenue; }
  const cabe = opciones.find((o) => g.measureText(o).width < w - der - finLeyenda - 8);
  if (cabe) g.fillText(cabe, w - der, 9);
  else g.fillText(opciones[opciones.length - 1], w - der, pI.y0 + 7);
}

const TIPOS: { v: TipoFibra; t: string; titulo: string }[] = [
  { v: 'mielinica', t: 'Mielínica', titulo: 'Fibra mielínica: nodos de Ranvier e internodos de 100·D' },
  { v: 'desmielinizada', t: 'Desmiel.', titulo: 'La misma fibra con un tercio de su mielina' },
  { v: 'amielinica', t: 'Sin mielina', titulo: 'Axón sin mielina: membrana excitable continua' },
];
const DOBLES = [0, 1, 3, 6];

function Seg<T extends string | number>({ valores, valor, onCambio, texto, titulo }: { valores: T[]; valor: T; onCambio: (v: T) => void; texto: (v: T) => string; titulo?: (v: T) => string }) {
  return (
    <div className="flex rounded-md border border-white/10 bg-white/[0.03] p-[2px]">
      {valores.map((v) => (
        <button key={String(v)} type="button" onClick={() => onCambio(v)} aria-pressed={v === valor} title={titulo?.(v)}
          className={`h-[22px] min-w-0 flex-1 rounded px-1 text-[10.5px] font-semibold tabular-nums transition-colors ${v === valor ? 'bg-sky-400/25 text-white' : 'text-slate-400 hover:text-white'}`}>
          {texto(v)}
        </button>
      ))}
    </div>
  );
}

export function DockBanco({ reloj, cfg, onCfg, onEstimular, umbral }: {
  reloj: RelojBanco; cfg: ConfigBanco; onCfg: (c: Partial<ConfigBanco>) => void; onEstimular: () => void; umbral: number;
}) {
  const [caja, tam] = useTamano<HTMLDivElement>();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujar = useCallback(() => { if (lienzo.current && tam.w > 0) dibujarBanco(lienzo.current, tam.w, tam.h, reloj); }, [reloj, tam.w, tam.h]);
  useEffect(() => { dibujar(); return reloj.suscribir(dibujar); }, [reloj, dibujar]);
  const maxNA = Math.max(4, Math.ceil(umbral * 4));
  return (
    <div className="flex h-[clamp(150px,29%,228px)] shrink-0 gap-2 border-t border-white/10 bg-[#0c1524] p-2" data-dock="banco">
      <div className="flex w-[210px] shrink-0 flex-col justify-center gap-[5px] text-[10.5px] text-slate-300">
        <Seg valores={TIPOS.map((x) => x.v)} valor={cfg.tipo} onCambio={(v) => onCfg({ tipo: v })} texto={(v) => TIPOS.find((x) => x.v === v)!.t} titulo={(v) => TIPOS.find((x) => x.v === v)!.titulo} />
        <div className="flex items-center gap-1.5"><span className="w-8 shrink-0 text-slate-400">Ø µm</span>
          <div className="flex-1"><Seg valores={[...DIAMETROS] as number[]} valor={cfg.D} onCambio={(v) => onCfg({ D: v })} texto={(v) => String(v)} /></div></div>
        <label className="flex items-center gap-1.5"><span className="w-8 shrink-0 text-slate-400">I</span>
          <input type="range" min={0} max={maxNA} step={0.05} value={cfg.estimulo} onChange={(e) => onCfg({ estimulo: Number(e.target.value) })}
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400" aria-label="Corriente del estímulo (nA)" />
          <span className="w-[52px] shrink-0 text-right font-mono tabular-nums text-white">{num(cfg.estimulo, 2)} nA</span></label>
        <div className="flex items-center gap-1.5"><span className="w-8 shrink-0 text-slate-400" title="Segundo pulso igual, a los ms indicados">2.º</span>
          <div className="flex-1"><Seg valores={DOBLES} valor={cfg.doble} onCambio={(v) => onCfg({ doble: v })} texto={(v) => (v === 0 ? '—' : `${v} ms`)} titulo={(v) => (v === 0 ? 'Un solo pulso' : `Segundo pulso a los ${v} ms (periodo refractario)`)} /></div></div>
        <button type="button" onClick={onEstimular}
          className="flex h-[26px] items-center justify-center gap-1.5 rounded-md bg-sky-500/80 text-[11px] font-semibold text-white hover:bg-sky-500">
          <Play size={12} /> Estimular
        </button>
      </div>
      <div ref={caja} className="relative min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-black/40">
        <canvas ref={lienzo} className="absolute inset-0 h-full w-full" role="img" aria-label="Potencial de membrana del soma y del nodo B y corrientes de sodio y potasio del soma" />
      </div>
    </div>
  );
}

// ───────────────────────────── arco ─────────────────────────────

function dibujarEMG(cv: HTMLCanvasElement, w: number, h: number, r: RelojArco, revelar: boolean) {
  const g = preparar(cv, w, h); if (!g) return;
  const e = r.ensayo;
  const t = e ? r.t : -Infinity;
  const T = ventanaEMG(e && e.supra ? e.L : e ? e.cron.llegadaMedula * 2 + 1.5 : 20);
  const izq = 34, der = 10, arriba = 20, abajo = 15, hCron = 24;
  const pE: Panel = { x0: izq, x1: w - der, y0: arriba, y1: h - abajo - hCron - 6, t0: 0, t1: T, v0: -3, v1: 3 };
  ejes(g, pE, [-2, 0, 2], 'mV', false);
  // cronograma (mismo eje de tiempo)
  const yC = pE.y1 + 6, hC = hCron - 4;
  g.fillStyle = 'rgba(255,255,255,0.03)'; g.fillRect(pE.x0, yC, pE.x1 - pE.x0, hC);
  g.font = FUENTE(9.5); g.fillStyle = COL.tenue; g.textAlign = 'center'; g.textBaseline = 'top';
  const paso = pasoBonito(T, Math.max(3, Math.round((pE.x1 - pE.x0) / 70)));
  for (let k = 0; k * paso <= T + 1e-9; k++) { const x = px(pE, k * paso); if (x <= pE.x1 - 20) g.fillText(num(k * paso, 0), x, h - abajo + 2); }
  g.textAlign = 'right'; g.fillText('ms', pE.x1, h - abajo + 2);
  leyenda(g, izq, 9, [['EMG cuádriceps', '#9be7c4']]);
  if (!e || !Number.isFinite(t)) return;
  const c = e.cron;
  const mitad = revelar ? num(c.conduccion / 2, 1) : '?';
  // rótulo largo y, si no cabe en el tramo, el corto
  const tramos: [number, number, string, string, string][] = [
    [0, c.llegadaMedula, '#6fa8ff', `aferente ${revelar ? mitad + ' ms' : '?'}`, mitad],
    [c.llegadaMedula, c.disparoMN, '#9aa7b8', 'sinapsis 0,7', '0,7'],
    [c.disparoMN, c.llegadaPlaca, '#5fcf9f', `eferente ${revelar ? mitad + ' ms' : '?'}`, mitad],
    [c.llegadaPlaca, c.respuesta, '#9aa7b8', 'placa 0,8', '0,8'],
  ];
  const fin = e.supra ? tramos.length : 1;
  g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = FUENTE(9.5, 600);
  for (let k = 0; k < fin; k++) {
    const [a, b2, col, largo, corto] = tramos[k];
    if (t <= a) break;
    const x0 = px(pE, a), x1 = px(pE, Math.min(b2, t));
    g.fillStyle = col + 'cc'; g.fillRect(x0, yC + 2, Math.max(1, x1 - x0 - 1), hC - 4);
    const ancho = px(pE, b2) - x0;
    const txt = ancho > g.measureText(largo).width + 6 ? largo : ancho > g.measureText(corto).width + 4 ? corto : '';
    if (t >= b2 && txt) { g.fillStyle = '#0a1220'; g.fillText(txt, (x0 + px(pE, b2)) / 2, yC + hC / 2); }
  }
  if (!e.supra && t > c.llegadaMedula + 1.2) {
    g.fillStyle = COL.texto; g.textAlign = 'left'; g.fillText('sin disparo de la motoneurona', px(pE, c.llegadaMedula) + 6, yC + hC / 2);
  }
  // golpe
  g.fillStyle = '#ffd36b'; const xg = px(pE, 0);
  g.beginPath(); g.moveTo(xg, pE.y0); g.lineTo(xg + 5, pE.y0 - 7); g.lineTo(xg - 5, pE.y0 - 7); g.closePath(); g.fill();
  // trazo del EMG hasta el instante actual
  const hasta = Math.min(t, T);
  if (hasta > 0) {
    const n = Math.max(2, Math.ceil(hasta / 0.025));
    traza(g, pE, n + 1, (k) => Math.min(hasta, k * 0.025), (k) => emg(Math.min(hasta, k * 0.025), e.Lemg, e.n), '#9be7c4', 1.3);
  }
  // latencia medida
  if (e.supra && t >= e.L) {
    const xL = Math.round(px(pE, e.L)) + 0.5;
    g.setLineDash([4, 3]); g.strokeStyle = 'rgba(255,214,140,0.85)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(xL, pE.y0); g.lineTo(xL, yC + hC); g.stroke(); g.setLineDash([]);
    g.font = FUENTE(10.5, 700); g.fillStyle = '#ffe3a6'; g.textAlign = xL > (pE.x0 + pE.x1) / 2 ? 'right' : 'left'; g.textBaseline = 'top';
    g.fillText(`L = ${num(e.L, 1)} ms`, xL + (g.textAlign === 'left' ? 5 : -5), pE.y0 + 2);
  }
  if (t >= 0 && t <= T) {
    const x = Math.round(px(pE, t)) + 0.5;
    g.strokeStyle = 'rgba(255,214,140,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, pE.y0); g.lineTo(x, pE.y1); g.stroke();
  }
}

function dibujarMN(cv: HTMLCanvasElement, w: number, h: number, r: RelojArco) {
  const g = preparar(cv, w, h); if (!g) return;
  const e = r.ensayo;
  const izq = 34, der = 8, arriba = 20, abajo = 15, sep = 6;
  const alto = h - arriba - abajo - sep;
  const hV = Math.round(alto * 0.64);
  const pV: Panel = { x0: izq, x1: w - der, y0: arriba, y1: arriba + hV, t0: -0.5, t1: 5, v0: -90, v1: 50 };
  const pI: Panel = { x0: izq, x1: w - der, y0: arriba + hV + sep, y1: h - abajo, t0: -0.5, t1: 5, v0: -1, v1: 1 };
  let m = 0.25;
  if (e) for (let k = 0; k < e.mn.V.length; k++) m = Math.max(m, Math.abs(e.mn.INa[k]) / 1000, Math.abs(e.mn.IK[k]) / 1000);
  const sI = escalaI(m); pI.v0 = -sI; pI.v1 = sI;
  ejes(g, pV, [-80, -40, 0, 40], 'mV', false);
  ejes(g, pI, [-sI, 0, sI], 'mA/cm²', true);
  leyenda(g, izq, 9, [['Motoneurona α', '#5fcf9f'], ['I_Na', '#ffb050'], ['I_K', '#b48cff']]);
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'top';
  g.fillText('0 = llegada Ia', pV.x1 - 2, pV.y0 + 2);
  if (!e || !Number.isFinite(r.t)) return;
  const rel = r.t - e.cron.llegadaMedula;
  if (rel <= -0.5) return;
  const tr = e.mn;
  const n = Math.min(tr.t.length, Math.max(0, Math.floor((Math.min(rel, 5) - tr.t[0]) / tr.dt) + 1));
  const paso = Math.max(1, Math.floor(n / 900));
  const nn = Math.floor(n / paso);
  traza(g, pI, nn, (k) => tr.t[k * paso], (k) => tr.IK[k * paso] / 1000, '#b48cff', 1.3);
  traza(g, pI, nn, (k) => tr.t[k * paso], (k) => tr.INa[k * paso] / 1000, '#ffb050', 1.3);
  traza(g, pV, nn, (k) => tr.t[k * paso], (k) => tr.V[k * paso], '#5fcf9f', 1.7);
}

export function DockArco({ reloj, revelar, distancia }: { reloj: RelojArco; revelar: boolean; distancia: number }) {
  const [cajaE, tamE] = useTamano<HTMLDivElement>();
  const [cajaM, tamM] = useTamano<HTMLDivElement>();
  const lE = useRef<HTMLCanvasElement>(null);
  const lM = useRef<HTMLCanvasElement>(null);
  const revRef = useRef(revelar); revRef.current = revelar;
  const dibujar = useCallback(() => {
    if (lE.current && tamE.w > 0) dibujarEMG(lE.current, tamE.w, tamE.h, reloj, revRef.current);
    if (lM.current && tamM.w > 0) dibujarMN(lM.current, tamM.w, tamM.h, reloj);
  }, [reloj, tamE.w, tamE.h, tamM.w, tamM.h]);
  useEffect(() => { dibujar(); return reloj.suscribir(dibujar); }, [reloj, dibujar]);
  useEffect(() => { dibujar(); }, [revelar, dibujar]);
  const e = reloj.ensayo;
  const v = revelar && e && e.supra ? distancia / ((e.L - 1.5) / 1000) : null;
  return (
    <div className="flex h-[clamp(150px,29%,228px)] shrink-0 gap-2 border-t border-white/10 bg-[#0c1524] p-2" data-dock="arco">
      <div ref={cajaE} className="relative min-w-0 flex-[1.55] overflow-hidden rounded-md ring-1 ring-black/40">
        <canvas ref={lE} className="absolute inset-0 h-full w-full" role="img" aria-label="Electromiograma del cuádriceps y cronograma del arco reflejo" />
        {v !== null && e && (
          <span className="pointer-events-none absolute bottom-[47px] right-3 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-200">
            v = {num(distancia, 2)} m / ({num(e.L, 1)} − 1,5) ms = {num(v, 0)} m/s
          </span>
        )}
      </div>
      <div ref={cajaM} className="relative min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-black/40">
        <canvas ref={lM} className="absolute inset-0 h-full w-full" role="img" aria-label="Registro intracelular de la motoneurona alfa" />
      </div>
    </div>
  );
}
