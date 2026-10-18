'use client';
/**
 * bio04/Dock.tsx — el dock de instrumentos de la fotosíntesis, en DOM nítido (lienzos a
 * devicePixelRatio, tipografía del lab). Lee el MISMO reloj que la escena (`RelojFoto`):
 * cuando la escena integra un cuadro sube `version` y el dock se redibuja con ese estado.
 *
 *  - Tubo colector: el O₂ del ensayo (sube durante la medición, cámara rápida ×240), las
 *    burbujas que llegan (Ø 2,7 mm = 0,01 mL), la meta marcada y el balance del ensayo
 *    (µmol de O₂ y de CO₂ fijado, mg de glucosa).
 *  - Respuesta a la luz: tasa neta frente a la PPFD con el punto de operación y los
 *    ensayos del alumno. Las CURVAS P(I), Ik, el punto de compensación y la saturación se
 *    dibujan sólo tras validar (no regalar).
 *  - Espectro: absorción de clorofila a, clorofila b y carotenoides y la emisión de la
 *    lámpara, con la energía del fotón E = hc/λ. El espectro de acción de McCree (lo que
 *    rinde cada color) aparece sólo tras validar.
 *  - Esquema Z (vista del tilacoide): potenciales de los portadores, los dos saltos de luz
 *    (E₀₀ de P680 y P700) frente a la energía del fotón de la lámpara, y el electrón que
 *    sigue la escena.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  LAMPARA, NOMBRE_PIGMENTO, COLOR_PIGMENTO, absorcionPigmento, emisionLED, accionMcCree, energiaFotonEV,
  netaI, compensacion, irradianciaIk, saturacion95, balanceO2, ESQUEMA_Z, E00_P680, E00_P700, colorLambda, ppfdB4,
  eficiencia, V_BURBUJA_ML, DURACION_B4, FOTONES_POR_O2, H_POR_O2, ATP_POR_O2, NADPH_POR_O2, SUBUNIDADES_C, K_CID, CID_BASE,
  T_OPT, OMEGA_T, Q10_RESPIRACION, RENDIMIENTO_CUANTICO_ROJO, escalaParticulas, CAMARA_LENTA_MEMBRANA, TURNOVER_PSII_MAX,
  type Pigmento, type ColorLuzB4,
} from './fotosintesis';
import { CAMARA_RAPIDA_ENSAYO, type RelojFoto } from './reloj';
import type { VistaB4 } from './Fotosintesis3DScene';

// ───────────────────────────── formato (coma decimal) ─────────────────────────────

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

/** Re-render a ≤ `hz` cuando el reloj integra un cuadro nuevo. */
export function useTickReloj(reloj: React.MutableRefObject<RelojFoto>, hz = 30): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id = 0, ultimaV = -1, t0 = 0;
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const r = reloj.current;
      if (r.version !== ultimaV && ahora - t0 >= 1000 / hz) { ultimaV = r.version; t0 = ahora; setTick((n) => n + 1); }
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, [reloj, hz]);
  return tick;
}

// ───────────────────────────── lienzos ─────────────────────────────

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');

function Lienzo({ alto, ancho: anchoFijo, dibujar, deps, etiqueta }: {
  alto: number; ancho?: number; dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; deps: unknown[]; etiqueta: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [ancho, setAncho] = useState(anchoFijo ?? 0);
  useLayoutEffect(() => {
    if (anchoFijo) return;
    const el = caja.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchoFijo]);
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
    <div ref={caja} className={anchoFijo ? 'shrink-0' : 'w-full'} style={anchoFijo ? { width: anchoFijo } : undefined}>
      <canvas ref={lienzo} role="img" aria-label={etiqueta} style={{ width: anchoFijo ?? '100%', height: alto, display: 'block' }} />
    </div>
  );
}

function marcas(a: number, b: number, n = 4): number[] {
  const paso0 = (b - a) / n;
  const p = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 5, 10].map((k) => k * p).find((s) => s >= paso0) ?? 10 * p;
  const out: number[] = [];
  for (let v = Math.ceil(a / paso) * paso; v <= b + 1e-9; v += paso) out.push(Math.abs(v) < 1e-12 ? 0 : v);
  return out;
}

/** Una gráfica más baja que esto (1366×768 con el dock abierto) sólo rotula los extremos del eje y. */
const ALTO_CHICO = 80;
/** Una gráfica más estrecha que esto (1600×900 con el dock abierto) usa rótulos de eje cortos. */
const ANCHO_ESTRECHO = 220;
/** Texto con un halo del color del fondo: se lee aunque caiga sobre una curva. */
function textoHalo(ctx: CanvasRenderingContext2D, txt: string, x: number, y: number) {
  const fill = ctx.fillStyle;
  ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(12,19,34,0.9)';
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = fill; ctx.fillText(txt, x, y);
}
/** Ejes; los rótulos de eje se pintan al final (`rotular`), encima de las curvas y con halo. */
interface Ejes { X: (v: number) => number; Y: (v: number) => number; m: { l: number; r: number; t: number; b: number }; rotular: () => void }
function ejes(ctx: CanvasRenderingContext2D, w: number, h: number, o: {
  x0: number; x1: number; y0: number; y1: number; xFmt: (v: number) => string; yFmt: (v: number) => string;
  /** cadena vacía: sin rótulo de eje */
  xLabel: string; yLabel: string;
  xMarcas?: number[]; yMarcas?: number[]; izq?: number; abajo?: number; dyX?: number;
}): Ejes {
  const chico = h < ALTO_CHICO;
  const m = { l: o.izq ?? 34, r: 8, t: 8, b: o.abajo ?? 22 };
  const X = (v: number) => m.l + ((v - o.x0) / (o.x1 - o.x0)) * (w - m.l - m.r);
  const Y = (v: number) => h - m.b - ((v - o.y0) / (o.y1 - o.y0)) * (h - m.t - m.b);
  const f = familia();
  const xt = o.xMarcas ?? marcas(o.x0, o.x1, 4);
  const yt0 = o.yMarcas ?? marcas(o.y0, o.y1, 3);
  // en una gráfica baja las cifras del eje y se pisarían: sólo los extremos
  const yt = chico && yt0.length > 2 ? [yt0[0], yt0[yt0.length - 1]] : yt0;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(148,163,184,0.13)';
  for (const t of xt) { ctx.beginPath(); ctx.moveTo(Math.round(X(t)) + 0.5, m.t); ctx.lineTo(Math.round(X(t)) + 0.5, h - m.b); ctx.stroke(); }
  for (const t of yt) { ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(t)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(t)) + 0.5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.beginPath(); ctx.moveTo(m.l + 0.5, m.t); ctx.lineTo(m.l + 0.5, h - m.b + 0.5); ctx.lineTo(w - m.r, h - m.b + 0.5); ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 ${chico ? 9 : 10}px ${f}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const t of xt) ctx.fillText(o.xFmt(t), X(t), h - m.b + (o.dyX ?? 4));
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of yt) ctx.fillText(o.yFmt(t), m.l - 4, Y(t));
  const rotular = () => {
    ctx.font = `600 ${chico ? 9 : 10}px ${f}`;
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    if (o.xLabel) textoHalo(ctx, o.xLabel, w - m.r, h - m.b - 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    if (o.yLabel) textoHalo(ctx, o.yLabel, m.l + 4, m.t);
  };
  return { X, Y, m, rotular };
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
  if (hueco) { ctx.strokeStyle = color; ctx.stroke(); }
  else { ctx.fillStyle = color; ctx.strokeStyle = '#0b1220'; ctx.fill(); ctx.stroke(); }
}

const ALTO_GRAF_MAX = 140, ALTO_GRAF_MIN = 50;
const ORDEN: ColorLuzB4[] = ['rojo', 'amarillo', 'blanco', 'verde', 'azul'];

export interface EnsayoDock { color: ColorLuzB4; distancia: number; o2: number; reto: boolean; T: number; nahco3: number }

export interface DockFotoProps {
  reloj: React.MutableRefObject<RelojFoto>;
  vista: VistaB4;
  ensayos: EnsayoDock[];
  meta: number;
  dMin: number;
  /** el reto ya se validó: se pueden dibujar las curvas teóricas y el espectro de acción */
  revela: boolean;
  pie?: React.ReactNode;
}

// ───────────────────────────── tubo colector ─────────────────────────────

/** Dibujo del tubo graduado invertido con el gas, las burbujas y la meta (0 a 3,5 mL). */
function dibujarTubo(ctx: CanvasRenderingContext2D, w: number, h: number, o2: number, meta: number, burbujasMin: number, tReal: number, rapido: boolean) {
  const f = familia();
  const x0 = 16, x1 = w - 8, y0 = 8, y1 = h - 10;
  const ML = 3.5;
  const Y = (mL: number) => y0 + 6 + (mL / ML) * (y1 - y0 - 12);
  // vidrio
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, 'rgba(160,220,240,0.10)'); g.addColorStop(0.35, 'rgba(200,240,255,0.22)'); g.addColorStop(1, 'rgba(120,180,210,0.08)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, [8, 8, 2, 2]); ctx.fill();
  // agua (debajo del gas)
  ctx.fillStyle = 'rgba(56,150,190,0.38)';
  ctx.fillRect(x0 + 2, Y(Math.min(ML, o2)), x1 - x0 - 4, y1 - Y(Math.min(ML, o2)) - 1);
  // gas (arriba: el tubo está invertido)
  ctx.fillStyle = 'rgba(226,245,255,0.16)';
  ctx.fillRect(x0 + 2, y0 + 2, x1 - x0 - 4, Y(Math.min(ML, o2)) - y0 - 2);
  // menisco
  ctx.strokeStyle = 'rgba(190,235,255,0.9)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0 + 2, Y(Math.min(ML, o2))); ctx.lineTo(x1 - 2, Y(Math.min(ML, o2))); ctx.stroke();
  // graduación
  ctx.strokeStyle = 'rgba(203,213,225,0.55)'; ctx.fillStyle = '#94a3b8'; ctx.font = `500 9px ${f}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 35; k++) {
    const y = Math.round(Y(k / 10)) + 0.5, L = k % 10 === 0 ? 7 : k % 5 === 0 ? 5 : 3;
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + 2, y); ctx.lineTo(x0 + 2 + L, y); ctx.stroke();
    if (k % 10 === 0) ctx.fillText(String(k / 10), x0 - 3, y);
  }
  // meta
  const ym = Math.round(Y(meta)) + 0.5;
  ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
  ctx.beginPath(); ctx.moveTo(x0 - 2, ym); ctx.lineTo(x1 + 2, ym); ctx.stroke(); ctx.setLineDash([]);
  // burbujas: suben desde la boca (abajo) hasta la superficie del gas
  const tasa = (burbujasMin / 60) * (rapido ? CAMARA_RAPIDA_ENSAYO / 8 : 1);   // en el ensayo, ×240 (dibujadas 1 de cada 8)
  if (tasa > 0) {
    const sube = 0.9;                       // s que tarda una burbuja en subir
    const n0 = Math.floor((tReal - sube) * tasa), n1 = Math.floor(tReal * tasa);
    ctx.fillStyle = 'rgba(236,250,255,0.85)';
    for (let k = Math.max(n0, n1 - 40); k <= n1; k++) {
      const u = (tReal - k / tasa) / sube; if (u < 0 || u > 1) continue;
      const yb = y1 - 4 - u * (y1 - 4 - Y(Math.min(ML, o2)));
      const xb = (x0 + x1) / 2 + Math.sin(k * 2.3 + u * 6) * (x1 - x0) * 0.18;
      ctx.beginPath(); ctx.arc(xb, yb, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ───────────────────────────── dock ─────────────────────────────

export function DockFoto({ reloj, vista, ensayos, meta, dMin, revela, pie }: DockFotoProps) {
  const tick = useTickReloj(reloj);
  const r = reloj.current;
  const cond = r.cond;
  const e = r.ensayo;
  const o2Tubo = e ? e.o2 : r.ultimo?.o2 ?? 0;
  const condTubo = e ? e.cond : r.ultimo?.cond ?? cond;
  const bal = balanceO2(o2Tubo, condTubo.T);
  const lamp = LAMPARA[cond.color];

  // ── respuesta a la luz ──
  const IMAX = 600, YMIN = -0.06, YMAX = 0.3;
  const dibujarPI = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { X, Y, rotular } = ejes(ctx, w, h, {
      x0: 0, x1: IMAX, y0: YMIN, y1: YMAX, xFmt: (v) => cifra(v, 0), yFmt: (v) => cifra(v, 1), xLabel: 'PPFD',
      yLabel: w < ANCHO_ESTRECHO ? 'mL O₂/min' : 'O₂ neto (mL/min)',
      yMarcas: [0, 0.1, 0.2, 0.3],
    });
    // cero (la respiración por debajo)
    ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(IMAX), Y(0)); ctx.stroke(); ctx.setLineDash([]);
    // banda de la lámpara (de 60 cm a la distancia mínima)
    ctx.fillStyle = 'rgba(148,163,184,0.06)';
    ctx.fillRect(X(ppfdB4(60)), Y(YMAX), X(Math.min(IMAX, ppfdB4(dMin))) - X(ppfdB4(60)), Y(YMIN) - Y(YMAX));
    if (revela) {
      for (const c of ORDEN) {
        const cc = { ...cond, color: c };
        const pts: [number, number][] = [];
        for (let i = 0; i <= 120; i++) { const I = (i / 120) * IMAX; pts.push([X(I), Y(Math.max(YMIN, netaI(cc, I)))]); }
        trazo(ctx, pts, c === cond.color ? LAMPARA[c].hex : `${LAMPARA[c].hex}66`, c === cond.color ? 2 : 1.1);
      }
      // compensación, Ik y saturación de la lámpara elegida
      const Ic = compensacion(cond), Ik = irradianciaIk(cond), I95 = saturacion95(cond);
      ctx.font = `700 9px ${familia()}`; ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
      if (Ik < IMAX) {
        ctx.strokeStyle = 'rgba(248,250,252,0.45)'; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X(Ik), Y(YMIN)); ctx.lineTo(X(Ik), Y(YMAX)); ctx.stroke(); ctx.setLineDash([]);
        // Ik y 95 % van en la franja bajo el cero (ahí no pasa ninguna curva útil), sin pisar «PPFD»
        if (X(Ik) < w - 46) { ctx.fillStyle = '#cbd5e1'; textoHalo(ctx, 'Ik', X(Ik), h - 24); }
      }
      if (I95 < IMAX && X(I95) < w - 50) { ctx.fillStyle = '#cbd5e1'; textoHalo(ctx, '95 %', X(I95), h - 24); }
      if (Ic < IMAX) { punto(ctx, X(Ic), Y(0), '#f8fafc', 3.5); ctx.fillStyle = '#f8fafc'; ctx.textAlign = 'left'; textoHalo(ctx, 'Ic', X(Ic) + 5, Y(0) - 3); }
    }
    // ensayos del alumno (llenos: reto; huecos: explorando)
    for (const en of ensayos) punto(ctx, X(Math.min(IMAX, ppfdB4(en.distancia))), Y(Math.max(YMIN, en.o2 / DURACION_B4)), LAMPARA[en.color].hex, 3.5, !en.reto);
    // punto de operación (el del reloj)
    const xo = X(Math.min(IMAX, r.I)), yo = Y(Math.max(YMIN, Math.min(YMAX, r.neta)));
    ctx.strokeStyle = lamp.hex; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(xo, yo, 6.5, 0, Math.PI * 2); ctx.stroke();
    punto(ctx, xo, yo, lamp.hex, 3);
    rotular();
  };

  // ── espectro ──
  const dibujarEspectro = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // baja (1366×768): sin rótulos de eje (el título de la sección dice «absorción» y la tira del arcoíris, λ)
    // y la tira pegada al eje, para que la curva conserve altura
    const chico = h < ALTO_CHICO;
    const { X, Y, m, rotular } = ejes(ctx, w, h, {
      x0: 400, x1: 700, y0: 0, y1: 1.08, xFmt: (v) => cifra(v, 0), yFmt: (v) => cifra(v, 1),
      xLabel: chico ? '' : 'λ (nm)', yLabel: chico ? '' : w < ANCHO_ESTRECHO ? 'absorción' : 'absorción relativa',
      xMarcas: [400, 500, 600, 700], yMarcas: [0, 0.5, 1], abajo: chico ? 19 : 26, dyX: chico ? 7 : 4,
    });
    // tira del arcoíris bajo el eje
    for (let l = 400; l < 700; l += 2) { const [cr, cg, cb] = colorLambda(l); ctx.fillStyle = `rgb(${cr * 255},${cg * 255},${cb * 255})`; ctx.fillRect(X(l), h - m.b + (chico ? 2 : 16), X(l + 2) - X(l) + 0.5, chico ? 3 : 4); }
    // emisión de la lámpara (área)
    ctx.beginPath(); ctx.moveTo(X(400), Y(0));
    for (let l = 400; l <= 700; l += 2) ctx.lineTo(X(l), Y(emisionLED(cond.color, l)));
    ctx.lineTo(X(700), Y(0)); ctx.closePath();
    ctx.fillStyle = `${lamp.hex}40`; ctx.fill();
    ctx.strokeStyle = `${lamp.hex}aa`; ctx.lineWidth = 1; ctx.stroke();
    // pigmentos
    for (const p of ['clorofilaA', 'clorofilaB', 'carotenoides'] as Pigmento[]) {
      const pts: [number, number][] = [];
      for (let l = 400; l <= 700; l += 2) pts.push([X(l), Y(absorcionPigmento(p, l))]);
      trazo(ctx, pts, COLOR_PIGMENTO[p], 1.6);
    }
    // cada curva lleva su nombre junto a ella (sin leyenda aparte)
    ctx.font = `700 9px ${familia()}`; ctx.textBaseline = 'bottom';
    const rotulo = (txt: string, l: number, v: number, color: string, alin: CanvasTextAlign, dx = 0) => {
      ctx.font = `700 9px ${familia()}`; ctx.textBaseline = 'bottom';
      let x = X(l) + dx;
      // en un dock estrecho no se sale por la derecha
      if (alin === 'left' && x + ctx.measureText(txt).width > w - 2) { alin = 'right'; x = w - 2; }
      ctx.textAlign = alin; ctx.fillStyle = color; textoHalo(ctx, txt, x, Math.max(m.t + 10, Y(v) - 3));
    };
    if (revela) {
      const pts: [number, number][] = [];
      for (let l = 400; l <= 700; l += 2) pts.push([X(l), Y(accionMcCree(l))]);
      trazo(ctx, pts, '#f8fafc', 2.2, [5, 3]);
      for (const c of ORDEN) { const L = LAMPARA[c]; if (c !== 'blanco') punto(ctx, X(L.pico), Y(eficiencia(c)), L.hex, 3.5); }
    }
    // los rótulos, encima de todas las curvas
    rotular();
    rotulo('Chl a', 661, absorcionPigmento('clorofilaA', 661), COLOR_PIGMENTO.clorofilaA, 'left', 5);
    rotulo('Chl b', 642, absorcionPigmento('clorofilaB', 642), COLOR_PIGMENTO.clorofilaB, 'right', -4);
    rotulo('Carot.', 492, absorcionPigmento('carotenoides', 492), COLOR_PIGMENTO.carotenoides, 'left', 4);
    if (revela) rotulo('acción', 585, accionMcCree(585) + 0.06, '#f8fafc', 'center');
  };

  // ── esquema Z ──
  const dibujarZ = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const f = familia();
    const E0 = -1.45, E1 = 1.35;
    const m = { l: 30, r: 6, t: 8, b: 8 };
    const Y = (E: number) => m.t + ((E - E0) / (E1 - E0)) * (h - m.t - m.b);   // negativo ARRIBA (convención)
    const n = ESQUEMA_Z.length;
    const X = (i: number) => m.l + (i / (n - 1)) * (w - m.l - m.r);
    ctx.font = `500 9px ${f}`; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of h < ALTO_CHICO * 1.25 ? [-1, 0, 1] : [-1, -0.5, 0, 0.5, 1]) {
      ctx.strokeStyle = 'rgba(148,163,184,0.13)'; ctx.beginPath(); ctx.moveTo(m.l, Math.round(Y(v)) + 0.5); ctx.lineTo(w - m.r, Math.round(Y(v)) + 0.5); ctx.stroke();
      ctx.fillText(cifra(v, 1, true), m.l - 4, Y(v));
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#cbd5e1'; ctx.font = `600 10px ${f}`;
    ctx.fillText('E (V)', m.l + 2, m.t);
    // el camino del electrón
    const pts: [number, number][] = ESQUEMA_Z.map((p, i) => [X(i), Y(p.E)]);
    trazo(ctx, pts, 'rgba(250,204,21,0.75)', 1.6);
    // los dos saltos de luz, del color de la lámpara, y el fotón de la lámpara frente a E₀₀
    const Efot = energiaFotonEV(lamp.pico);
    for (const [ia, E00] of [[1, E00_P680], [8, E00_P700]] as [number, number][]) {
      const x = X(ia) + 2, ya = Y(ESQUEMA_Z[ia].E), yb = Y(ESQUEMA_Z[ia].E - Efot);
      ctx.strokeStyle = lamp.hex; ctx.lineWidth = 3; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(x + 3, ya); ctx.lineTo(x + 3, yb); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, ya); ctx.lineTo(x, Y(ESQUEMA_Z[ia].E - E00)); ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const p = ESQUEMA_Z[i];
      punto(ctx, X(i), Y(p.E), p.foto ? lamp.hex : '#e2e8f0', 2.6);
      ctx.fillStyle = '#cbd5e1'; ctx.font = `600 8.5px ${f}`;
      const arriba = i % 2 === 0;
      ctx.textAlign = 'center'; ctx.textBaseline = arriba ? 'bottom' : 'top';
      ctx.fillText(p.nombre, X(i), Y(p.E) + (arriba ? -4 : 4));
    }
    // el electrón que sigue la escena
    const tz = r.trazador;
    if (tz >= 0 && tz <= n - 1) {
      const i = Math.floor(tz), u = tz - i;
      const a = ESQUEMA_Z[i], b = ESQUEMA_Z[Math.min(n - 1, i + 1)];
      const x = X(i) + (X(Math.min(n - 1, i + 1)) - X(i)) * u, y = Y(a.E + (b.E - a.E) * u);
      ctx.fillStyle = 'rgba(253,224,71,0.35)'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      punto(ctx, x, y, '#fde047', 3.5);
    }
  };

  // el dock cabe sin scroll: las dos gráficas ceden altura si el panel es bajo
  const raiz = useRef<HTMLDivElement>(null);
  const [altoGraf, setAltoGraf] = useState(ALTO_GRAF_MAX);
  const altoActual = useRef(ALTO_GRAF_MAX);
  // panel bajo (p. ej. 1366×768): tubo en una fila y márgenes más justos
  const [compacto, setCompacto] = useState(false);
  // «Modelo y límites» abierto ocupa el sitio de los instrumentos (así nunca hay scroll)
  const [modelo, setModelo] = useState(false);
  const [pestana, setPestana] = useState<'ecuaciones' | 'limites'>('ecuaciones');
  // dock estrecho: las cabeceras no caben con su cifra a la derecha
  const [estrecho, setEstrecho] = useState(false);
  useLayoutEffect(() => {
    const el = raiz.current, caja = el?.parentElement;
    if (!el || !caja) return;
    const ajustar = () => {
      setEstrecho(el.clientWidth < 250);
      if (el.querySelector('details[open]')) return;
      const cs = getComputedStyle(caja);
      const util = caja.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      setCompacto(util < 470);
      const resto = el.scrollHeight - 2 * altoActual.current - (vista === 'tilacoide' ? altoActual.current * 0.12 : 0);
      const hh = Math.max(ALTO_GRAF_MIN, Math.min(ALTO_GRAF_MAX, Math.floor((util - resto) / (vista === 'tilacoide' ? 2.12 : 2))));
      if (hh !== altoActual.current) { altoActual.current = hh; setAltoGraf(hh); }
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(caja); ro.observe(el);
    ajustar();
    return () => ro.disconnect();
  }, [vista]);

  const altoTubo = compacto ? 58 : Math.max(84, Math.min(116, altoGraf - 10));
  const sec = `rounded-lg border border-white/10 bg-white/[0.03] ${compacto ? 'px-2 py-1.5' : 'p-2.5'}`;
  const enCurso = !!e;
  const tMin = e ? e.tMin : r.ultimo ? DURACION_B4 : 0;

  return (
    <div ref={raiz} className={compacto ? 'space-y-1.5' : 'space-y-2'} data-dock="fotosintesis" data-tick={tick} data-compacto={compacto ? '' : undefined}>
      {!modelo && (<>
      {/* tubo colector */}
      <section className={sec} data-instrumento="tubo">
        <div className={`${compacto ? 'mb-0.5' : 'mb-1'} flex items-center justify-between gap-2`}>
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tubo colector</span>
          <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{enCurso ? `×${cifra(CAMARA_RAPIDA_ENSAYO, 0)}` : `${cifra(r.burbujasMin, 0)} burb./min`}</span>
        </div>
        <div className={`flex items-stretch ${compacto ? 'gap-2' : 'gap-2.5'}`}>
          <Lienzo alto={altoTubo} ancho={compacto ? 40 : 46} etiqueta="Tubo colector graduado con el O₂ recogido y la meta" deps={[tick, meta]}
            dibujar={(ctx, w, h) => dibujarTubo(ctx, w, h, o2Tubo, meta, r.burbujasMin, r.tReal, enCurso)} />
          <div className={`flex min-w-0 flex-1 font-mono tabular-nums ${compacto ? 'flex-row items-center justify-between gap-1.5' : 'flex-col justify-between'}`}>
            <div className="whitespace-nowrap">
              <span className={`${compacto ? 'text-[18px]' : 'text-[22px]'} font-semibold leading-none text-white`} data-lectura="o2">{cifra(o2Tubo, 2)}</span>
              <span className={`ml-1 ${compacto ? 'text-[11px]' : 'text-[12px]'} text-slate-400`}>mL O₂</span>
              <div className="mt-0.5 whitespace-normal text-[10px] text-slate-400">{cifra(tMin, 1)} / {DURACION_B4} min{!enCurso && r.ultimo && !r.ultimo.reto ? ' · explorando' : ''}</div>
            </div>
            <div className={`grid grid-cols-[auto_1fr] whitespace-nowrap leading-snug text-slate-300 ${compacto ? 'gap-x-1.5 text-[10px]' : 'gap-x-2 text-[10.5px]'}`}>
              <span className="text-slate-500">O₂</span><span className="text-right">{cifra(bal.o2, 1)} µmol</span>
              <span className="text-slate-500">CO₂ fijado</span><span className="text-right">{cifra(bal.co2, 1)} µmol</span>
              <span className="text-slate-500">glucosa</span><span className="text-right">{cifra(bal.glucosaMg, 2)} mg</span>
            </div>
          </div>
        </div>
      </section>

      {/* respuesta a la luz */}
      <section className={sec} data-instrumento="pi">
        <div className={`${compacto ? 'mb-0.5' : 'mb-1'} flex items-center justify-between gap-2`}>
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400">Respuesta a la luz</span>
          {!estrecho && <span className="whitespace-nowrap font-mono text-[10px] text-slate-400">{cifra(r.I, 0)} µmol·m⁻²·s⁻¹</span>}
        </div>
        <Lienzo alto={altoGraf} dibujar={dibujarPI} etiqueta="Tasa neta de O₂ frente a la irradiancia, con el punto de operación y los ensayos" deps={[tick, revela, ensayos, dMin]} />
      </section>

      {/* espectro o esquema Z */}
      {vista === 'cloroplasto' ? (
        <section className={sec} data-instrumento="espectro">
          <div className={`${compacto ? 'mb-0.5' : 'mb-1'} flex items-center justify-between gap-2`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{altoGraf < ALTO_CHICO ? 'Espectro de absorción' : 'Espectro'}</span>
            <span className="font-mono text-[10px] text-slate-400" title="Energía de un fotón del pico de la lámpara: E = hc/λ">
              {lamp.pico} nm · {cifra(energiaFotonEV(lamp.pico), 2)} eV
            </span>
          </div>
          <Lienzo alto={altoGraf} dibujar={dibujarEspectro} etiqueta={`Absorción de ${(['clorofilaA', 'clorofilaB', 'carotenoides'] as Pigmento[]).map((p) => NOMBRE_PIGMENTO[p]).join(', ')} y emisión de la lámpara${revela ? '; línea discontinua: espectro de acción' : ''}`} deps={[cond.color, revela]} />
        </section>
      ) : (
        <section className={sec} data-instrumento="esquemaZ">
          <div className={`${compacto ? 'mb-0.5' : 'mb-1'} flex items-center justify-between gap-2`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Esquema Z</span>
            <span className="font-mono text-[10px] text-slate-400" title="Fotón de la lámpara frente a la energía que usa cada fotosistema (E₀₀)">
              {cifra(energiaFotonEV(lamp.pico), 2)} eV · usa {cifra(E00_P680, 2)}
            </span>
          </div>
          <Lienzo alto={Math.round(altoGraf * 1.12)} dibujar={dibujarZ} etiqueta="Potenciales de reducción de la cadena de transporte de electrones" deps={[tick, cond.color]} />
        </section>
      )}
      </>)}

      <details className={`rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-[11px] text-slate-300 ${compacto ? 'py-1' : 'py-1.5'}`}
        onToggle={(ev) => setModelo((ev.currentTarget as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-slate-400">Modelo y límites</summary>
        <div className="mt-1.5 flex gap-1" role="tablist">
          {(['ecuaciones', 'limites'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={pestana === t} onClick={() => setPestana(t)}
              className={`rounded px-2 py-0.5 text-[10px] font-semibold ${pestana === t ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {t === 'ecuaciones' ? 'Ecuaciones' : 'Qué simplifica'}
            </button>
          ))}
        </div>
        {pestana === 'ecuaciones' ? (
          <ul className="mt-1.5 space-y-1 font-mono text-[10.5px] leading-snug text-slate-200">
            <li>PPFD = 1000·(10/d)² · E = hc/λ</li>
            <li>P = Pmax·(1 − e^(−I/I<sub>k</sub>)) − R · I<sub>k</sub> = Pmax/(φ·η)</li>
            <li>I<sub>c</sub> = −I<sub>k</sub>·ln(1 − R/Pmax) · saturación: I<sub>k</sub>·ln 20</li>
            <li>Pmax ∝ CID/(K + CID), K = {cifra(K_CID, 1)} mM · Pmax(T) ∝ e^(−((T−{T_OPT})/{OMEGA_T})²) · R ∝ {cifra(Q10_RESPIRACION, 0)}^((T−25)/10)</li>
            <li>6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂ · n = pV/RT</li>
            <li>Por O₂: {FOTONES_POR_O2} fotones, {H_POR_O2} H⁺, {cifra(ATP_POR_O2, 2)} ATP, {NADPH_POR_O2} NADPH (anillo c de {SUBUNIDADES_C})</li>
          </ul>
        ) : (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[10.5px] leading-snug">
            <li>Tamaños no a escala; membranas y tilacoides engrosados; proteínas como cúmulos de esferas.</li>
            <li>η por color: McCree (1972), redondeado; máximo {cifra(RENDIMIENTO_CUANTICO_ROJO, 3)} O₂ por fotón absorbido.</li>
            <li>CO₂ y T sólo cambian Pmax y R; agua sola {cifra(CID_BASE, 1)} mM de CID; el reto se mide a 25 °C y 0,1 % de NaHCO₃.</li>
            <li>Burbujas de {cifra(V_BURBUJA_ML, 2)} mL; el O₂ disuelto no se cuenta.</li>
            <li>Partículas al ritmo del modelo (1 O₂/s ≈ {cifra(1 / escalaParticulas(), 3)} mL/min); membrana ×1/{CAMARA_LENTA_MEMBRANA} ({TURNOVER_PSII_MAX} e⁻/s por PSII a plena luz).</li>
            <li>pH del lumen lineal con el flujo de e⁻ (7,5 → 5,8); H⁺ dibujados ∝ 10^−pH; ciclo Q neto (2 H⁺/e⁻), sin flujo cíclico.</li>
          </ul>
        )}
      </details>

      {pie}
    </div>
  );
}
