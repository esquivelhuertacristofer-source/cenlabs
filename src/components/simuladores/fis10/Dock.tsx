'use client';
/**
 * fis10/Dock.tsx — el dock DOM bajo la escena del motor. Lienzos 2D a devicePixelRatio
 * (trazos y texto nítidos) que leen EL MISMO reloj que la escena: cada cuadro integrado
 * avisa y el dock se redibuja con ese estado.
 *
 *  · Cifras: tacómetro (pulsos de la cinta), corriente, f.c.e.m. y rendimiento, y la barra
 *    del balance de potencia V·I = I²R + E·I.
 *  · τ(θ): el par de la bobina que alimenta el conmutador en una vuelta (con la corriente
 *    de ESTE cuadro), el de una sola bobina sin conmutador (media nula) y el del freno; el
 *    punto es el inducido ahora.
 *  · ω(t): la velocidad (en rpm) y la corriente frente al tiempo de MODELO.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { G_EXTREMOS, parInstantaneo, parSinConmutador, aRpm } from './motor';
import type { RelojMotor } from './reloj';
import { cifra, cifraSig } from './formato';

// ───────────────────────────── utilidades ─────────────────────────────

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
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext('2d');
  if (!g) return null;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#0a1220'; g.fillRect(0, 0, w, h);
  return g;
}

const FUENTE = (px: number, peso = 500) => `${peso} ${px}px Outfit, system-ui, sans-serif`;
const COL = {
  rejilla: 'rgba(148,180,205,0.12)', cero: 'rgba(170,196,214,0.35)', texto: 'rgba(214,228,240,0.88)', tenue: 'rgba(170,196,214,0.55)',
  par: '#ffb547', fantasma: 'rgba(160,178,200,0.75)', freno: '#ff7a8a', n: '#7fe0c8', I: '#ff9db0', objetivo: '#ffd36b',
};

function pasoBonito(rango: number, n = 4) {
  const bruto = rango / n;
  const p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto) return k * p;
  return 10 * p;
}
/** Tope «redondo» ≥ x (1, 2, 2,5, 5 × 10ⁿ). */
function tope(x: number) {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * p >= x) return k * p;
  return 10 * p;
}

interface Panel { x0: number; x1: number; y0: number; y1: number; a0: number; a1: number; v0: number; v1: number }
const PX = (p: Panel, a: number) => p.x0 + ((a - p.a0) / (p.a1 - p.a0)) * (p.x1 - p.x0);
const PY = (p: Panel, v: number) => p.y1 - ((v - p.v0) / (p.v1 - p.v0)) * (p.y1 - p.y0);

function leyenda(g: CanvasRenderingContext2D, x: number, y: number, items: [string, string, boolean?][], maxX: number) {
  g.font = FUENTE(10, 600); g.textBaseline = 'middle'; g.textAlign = 'left';
  let cx = x;
  for (const [t, c, rayada] of items) {
    const ancho = 22 + g.measureText(t).width;
    if (cx + ancho - 6 > maxX) break;
    g.strokeStyle = c; g.lineWidth = 2;
    g.setLineDash(rayada ? [3, 2.5] : []);
    g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + 12, y); g.stroke();
    g.setLineDash([]);
    g.fillStyle = COL.texto; g.fillText(t, cx + 16, y);
    cx += ancho;
  }
}

function recortar(g: CanvasRenderingContext2D, p: Panel) {
  g.save(); g.beginPath(); g.rect(p.x0, p.y0 - 2, p.x1 - p.x0, p.y1 - p.y0 + 4); g.clip();
}

// ───────────────────────────── τ(θ) ─────────────────────────────

const N_CURVA = 360;

function dibujarPar(cv: HTMLCanvasElement, w: number, h: number, r: RelojMotor, reserva = 0) {
  const g = preparar(cv, w, h); if (!g) return;
  const { c, p, e } = r;
  const l = r.lectura();
  const I = l.I, k = r.k;
  const tc = Math.max(0, p.carga);
  // en mN·m
  const amp = Math.max(k * I * G_EXTREMOS.max, tc) * 1000;
  const yMax = tope(Math.max(0.5, amp * 1.18));
  const izq = 34, der = 8, arriba = 20, abajo = 15;
  const P: Panel = { x0: izq, x1: w - der, y0: arriba, y1: h - abajo, a0: 0, a1: 360, v0: -yMax, v1: yMax };
  // rejilla
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (const a of [90, 180, 270]) { const x = Math.round(PX(P, a)) + 0.5; g.moveTo(x, P.y0); g.lineTo(x, P.y1); }
  for (const v of [-yMax, -yMax / 2, yMax / 2, yMax]) { const y = Math.round(PY(P, v)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); }
  g.stroke();
  g.strokeStyle = COL.cero; g.beginPath(); { const y = Math.round(PY(P, 0)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); } g.stroke();
  // ejes
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const v of [-yMax, 0, yMax]) g.fillText(cifraSig(v, 2), P.x0 - 4, PY(P, v));
  g.save(); g.translate(8, (P.y0 + P.y1) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('mN·m', 0, 0); g.restore();
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (const a of [0, 90, 180, 270]) g.fillText(`${a}°`, PX(P, a) + (a === 0 ? 6 : 0), P.y1 + 2);
  g.textAlign = 'right'; g.fillText('θ', P.x1, P.y1 + 2);

  recortar(g, P);
  // freno (lo que el motor tiene que vencer), con el signo del giro
  const sFreno = c.sentido === 0 ? 1 : c.sentido;
  if (tc > 0) {
    g.setLineDash([5, 4]); g.strokeStyle = COL.freno; g.lineWidth = 1.3;
    const y = PY(P, sFreno * tc * 1000);
    g.beginPath(); g.moveTo(P.x0, y); g.lineTo(P.x1, y); g.stroke(); g.setLineDash([]);
  }
  if (c.tipo === 'dipolo' && I > 0) {
    // una bobina sin conmutador
    g.setLineDash([3, 3]); g.strokeStyle = COL.fantasma; g.lineWidth = 1.2; g.beginPath();
    for (let i = 0; i <= N_CURVA; i++) {
      const a = (i / N_CURVA) * 360;
      const x = PX(P, a), y = PY(P, parSinConmutador(c, p.N, I, (a * Math.PI) / 180) * 1000);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke(); g.setLineDash([]);
  }
  // con conmutador
  g.strokeStyle = COL.par; g.lineWidth = 2.2; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= N_CURVA; i++) {
    const a = (i / N_CURVA) * 360;
    const x = PX(P, a), y = PY(P, parInstantaneo(c, p.N, I, (a * Math.PI) / 180) * 1000);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  // el inducido ahora
  const aNow = ((((e.theta * 180) / Math.PI) % 360) + 360) % 360;
  const xN = PX(P, aNow), yN = PY(P, e.tau * 1000);
  g.strokeStyle = 'rgba(255,214,140,0.35)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(Math.round(xN) + 0.5, P.y0); g.lineTo(Math.round(xN) + 0.5, P.y1); g.stroke();
  g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(xN, yN, 3.4, 0, Math.PI * 2); g.fill();
  g.restore();

  // título y leyenda
  g.font = FUENTE(10.5, 700); g.fillStyle = COL.texto; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('τ(θ)', izq, 9);
  const ini = izq + g.measureText('τ(θ)').width + 10;
  const items: [string, string, boolean?][] = [['conmutador', COL.par], ['1 bobina sin él', COL.fantasma, true], ['freno', COL.freno, true]];
  leyenda(g, ini, 9, c.tipo === 'dipolo' ? items : [['freno', COL.freno, true]], w - der - reserva);
  if (c.tipo !== 'dipolo' && I > 0) {
    g.font = FUENTE(10, 600); g.fillStyle = COL.par; g.textAlign = 'center'; g.textBaseline = 'bottom';
    g.fillText('polos iguales: las dos fuerzas no dan par', (P.x0 + P.x1) / 2, PY(P, 0) - 4);
  }
}

// ───────────────────────────── ω(t) ─────────────────────────────

function dibujarOmega(cv: HTMLCanvasElement, w: number, h: number, r: RelojMotor, objetivo: number | null, reserva = 0) {
  const g = preparar(cv, w, h); if (!g) return;
  const W = r.ventana, tNow = r.e.t;
  const izq = 40, der = 34, arriba = 20, abajo = 15;
  // rango de n e I en la ventana
  let nMin = 0, nMax = 0, iMax = 0;
  const n0 = r.hn;
  for (let k = 0; k < n0; k++) {
    const m = r.muestra(k);
    if (m.t < tNow - W) continue;
    const n = aRpm(m.w);
    nMin = Math.min(nMin, n); nMax = Math.max(nMax, n); iMax = Math.max(iMax, m.I);
  }
  if (objetivo !== null) { nMin = Math.min(nMin, objetivo); nMax = Math.max(nMax, objetivo); }
  const reg = r.p.energizado && r.reg.arranca ? r.reg.rpm : 0;
  nMin = Math.min(nMin, reg); nMax = Math.max(nMax, reg);
  const span = Math.max(100, nMax - nMin);
  const top = nMax > 0 ? tope(nMax + span * 0.12) : 0;
  const bot = nMin < 0 ? -tope(-nMin + span * 0.12) : 0;
  const Im = tope(Math.max(0.05, iMax * 1.15));
  const P: Panel = { x0: izq, x1: w - der, y0: arriba, y1: h - abajo, a0: -W, a1: 0, v0: bot, v1: top === bot ? 1 : top };
  // rejilla y ejes
  const paso = pasoBonito(P.v1 - P.v0, 3);
  g.strokeStyle = COL.rejilla; g.lineWidth = 1; g.beginPath();
  for (let v = Math.ceil(P.v0 / paso) * paso; v <= P.v1 + 1e-9; v += paso) { const y = Math.round(PY(P, v)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); }
  const pt = pasoBonito(W, Math.max(2, Math.round((P.x1 - P.x0) / 75)));
  for (let t = -Math.floor(W / pt) * pt; t <= 1e-9; t += pt) { const x = Math.round(PX(P, t)) + 0.5; g.moveTo(x, P.y0); g.lineTo(x, P.y1); }
  g.stroke();
  g.fillStyle = COL.tenue; g.font = FUENTE(9.5); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let v = Math.ceil(P.v0 / paso) * paso; v <= P.v1 + 1e-9; v += paso) g.fillText(cifra(v, 0), P.x0 - 4, PY(P, v));
  g.save(); g.translate(8, (P.y0 + P.y1) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('rpm', 0, 0); g.restore();
  g.textAlign = 'left';
  for (const v of [0, Im / 2, Im]) g.fillText(cifraSig(v, 2), P.x1 + 4, PY(P, P.v0 + ((P.v1 - P.v0) * v) / Im));
  g.save(); g.translate(w - 6, (P.y0 + P.y1) / 2); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillStyle = COL.I; g.fillText('A', 0, 0); g.restore();
  g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = COL.tenue;
  const decT = pt < 0.01 ? 3 : pt < 0.1 ? 2 : pt < 1 ? 1 : 0;
  for (let t = -Math.floor(W / pt) * pt; t <= 1e-9; t += pt) {
    const x = PX(P, t);
    if (x < P.x0 + 8) continue;
    g.fillText(Math.abs(t) < 1e-9 ? 'ahora' : cifra(t, decT), x - (Math.abs(t) < 1e-9 ? 12 : 0), P.y1 + 2);
  }
  g.textAlign = 'left'; g.fillText('s', P.x0, P.y1 + 2);
  if (P.v0 < 0) { g.strokeStyle = COL.cero; g.beginPath(); const y = Math.round(PY(P, 0)) + 0.5; g.moveTo(P.x0, y); g.lineTo(P.x1, y); g.stroke(); }

  recortar(g, P);
  if (objetivo !== null) {
    g.setLineDash([6, 4]); g.strokeStyle = COL.objetivo; g.lineWidth = 1.3;
    const y = PY(P, objetivo); g.beginPath(); g.moveTo(P.x0, y); g.lineTo(P.x1, y); g.stroke(); g.setLineDash([]);
  }
  // I(t) (eje derecho)
  const yI = (I: number) => PY(P, P.v0 + ((P.v1 - P.v0) * I) / Im);
  const trazo = (val: (m: { t: number; w: number; I: number }) => number, color: string, ancho: number) => {
    g.strokeStyle = color; g.lineWidth = ancho; g.lineJoin = 'round'; g.beginPath();
    let primero = true;
    for (let k = 0; k < n0; k++) {
      const m = r.muestra(k);
      if (m.t < tNow - W - 1e-9) continue;
      const x = PX(P, m.t - tNow), y = val(m);
      if (primero) { g.moveTo(x, y); primero = false; } else g.lineTo(x, y);
    }
    if (!primero) g.stroke();
  };
  trazo((m) => yI(m.I), COL.I, 1.2);
  trazo((m) => PY(P, aRpm(m.w)), COL.n, 2.1);
  g.restore();
  // título y leyenda
  g.font = FUENTE(10.5, 700); g.fillStyle = COL.texto; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('ω(t)', izq, 9);
  const ini = izq + g.measureText('ω(t)').width + 10;
  const it: [string, string, boolean?][] = [['n', COL.n], ['I', COL.I]];
  if (objetivo !== null) it.push(['objetivo', COL.objetivo, true]);
  leyenda(g, ini, 9, it, w - der - reserva);
}

// ───────────────────────────── cifras ─────────────────────────────

function Cifras({ reloj, compacto }: { reloj: RelojMotor; compacto: boolean }) {
  const refs = {
    n: useRef<HTMLSpanElement>(null), giro: useRef<HTMLSpanElement>(null), I: useRef<HTMLSpanElement>(null),
    E: useRef<HTMLSpanElement>(null), eta: useRef<HTMLSpanElement>(null), P: useRef<HTMLSpanElement>(null),
    barJ: useRef<HTMLDivElement>(null), barM: useRef<HTMLDivElement>(null),
  };
  useEffect(() => {
    let t0 = 0;
    const f = (forzar = false) => {
      const ahora = performance.now();
      if (!forzar && ahora - t0 < 110) return;
      t0 = ahora;
      const l = reloj.lectura();
      const set = (r: React.RefObject<HTMLElement | null>, s: string) => { if (r.current && r.current.textContent !== s) r.current.textContent = s; };
      set(refs.n, cifra(Math.abs(l.nTacho), 0));
      set(refs.giro, l.nTacho > 0 ? '↻' : l.nTacho < 0 ? '↺' : '');
      if (refs.giro.current) refs.giro.current.title = l.nTacho > 0 ? 'horario' : l.nTacho < 0 ? 'antihorario' : '';
      set(refs.I, cifraSig(l.I, 3));
      set(refs.E, cifra(l.E, 2, false));
      set(refs.eta, l.eta === null ? '—' : cifra(l.eta * 100, 1));
      set(refs.P, cifraSig(l.Pel, 3));
      const fJ = l.Pel > 1e-12 ? l.Pjoule / l.Pel : 0;
      if (refs.barJ.current) refs.barJ.current.style.width = `${(fJ * 100).toFixed(2)}%`;
      if (refs.barM.current) refs.barM.current.style.width = `${(l.Pel > 1e-12 ? (1 - fJ) * 100 : 0).toFixed(2)}%`;
    };
    f(true);
    return reloj.suscribir(() => f());
  }, [reloj]); // eslint-disable-line react-hooks/exhaustive-deps

  const fila = 'flex items-baseline justify-between gap-2';
  const et = 'text-[10.5px] font-semibold text-slate-400';
  const val = 'font-mono text-[12.5px] font-semibold tabular-nums text-white';
  const uni = 'ml-0.5 text-[10.5px] font-normal text-slate-400';
  if (compacto) {
    return (
      <div className="flex shrink-0 items-baseline justify-between gap-2 px-0.5" data-cifras-motor="">
        <span className={et}>n <span ref={refs.n} className="font-mono text-[15px] font-bold tabular-nums text-[#7fe0c8]" data-tacometro="" /><span className={uni}>rpm</span> <span ref={refs.giro} className="text-[13px] text-[#7fe0c8]" /></span>
        <span className={et}>I <span ref={refs.I} className={val} /><span className={uni}>A</span></span>
        <span className={et} title="Fuerza contraelectromotriz media k·ω">E <span ref={refs.E} className={val} /><span className={uni}>V</span></span>
        <span className={et}>η <span ref={refs.eta} className={val} /><span className={uni}>%</span></span>
        <span className="hidden"><span ref={refs.P} /><div ref={refs.barJ} /><div ref={refs.barM} /></span>
      </div>
    );
  }
  return (
    <div className="flex w-[150px] shrink-0 flex-col justify-between gap-1 py-0.5" data-cifras-motor="">
      <div>
        <div className={et}>Tacómetro</div>
        <div className="flex items-baseline gap-1">
          <span ref={refs.n} className="font-mono text-[22px] font-bold leading-none tabular-nums text-[#7fe0c8]" data-tacometro="" />
          <span className="text-[11px] text-slate-400">rpm</span>
          <span ref={refs.giro} className="text-[15px] leading-none text-[#7fe0c8]" />
        </div>
      </div>
      <div className={fila}><span className={et}>Corriente I</span><span><span ref={refs.I} className={val} /><span className={uni}>A</span></span></div>
      <div className={fila} title="Fuerza contraelectromotriz media E = k·ω"><span className={et}>f.c.e.m. E</span><span><span ref={refs.E} className={val} /><span className={uni}>V</span></span></div>
      <div className={fila} title="Potencia que pasa al rotor (E·I) entre la que entrega la fuente (V·I)"><span className={et}>Rendimiento η</span><span><span ref={refs.eta} className={val} /><span className={uni}>%</span></span></div>
      <div title="Balance de potencia: la que entrega la fuente se reparte en calor en el cobre (I²R) y la que pasa al rotor (E·I)">
        <div className="flex h-[7px] w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div ref={refs.barJ} className="h-full bg-[#ff7a8a]" />
          <div ref={refs.barM} className="h-full bg-[#7fe0c8]" />
        </div>
        <div className="mt-0.5 flex justify-between text-[9.5px] text-slate-400">
          <span><span className="text-[#ff9db0]">I²R</span> + <span className="text-[#7fe0c8]">E·I</span></span>
          <span>V·I = <span ref={refs.P} className="font-mono tabular-nums text-slate-200" /> W</span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── el dock ─────────────────────────────

export function DockMotor({ reloj, objetivo }: { reloj: RelojMotor; objetivo: number | null }) {
  const [caja, tam] = useTamano<HTMLDivElement>();
  const estrecho = tam.w > 0 && tam.w < 560;
  const [vista, setVista] = useState<'par' | 'omega'>('par');
  const [cajaA, tamA] = useTamano<HTMLDivElement>();
  const [cajaB, tamB] = useTamano<HTMLDivElement>();
  const lA = useRef<HTMLCanvasElement>(null);
  const lB = useRef<HTMLCanvasElement>(null);
  const obj = useRef(objetivo); obj.current = objetivo;
  const ultimo = useRef(0);
  const dibujar = useCallback((forzar = false) => {
    const ahora = performance.now();
    if (!forzar && ahora - ultimo.current < 30) return;
    ultimo.current = ahora;
    const verPar = !estrecho || vista === 'par', verOmega = !estrecho || vista === 'omega';
    const reserva = estrecho ? 92 : 0;
    if (verPar && lA.current && tamA.w > 0) dibujarPar(lA.current, tamA.w, tamA.h, reloj, reserva);
    if (verOmega && lB.current && tamB.w > 0) dibujarOmega(lB.current, tamB.w, tamB.h, reloj, obj.current, reserva);
  }, [reloj, tamA.w, tamA.h, tamB.w, tamB.h, estrecho, vista]);
  useEffect(() => { dibujar(true); return reloj.suscribir(() => dibujar()); }, [reloj, dibujar]);
  useEffect(() => { dibujar(true); }, [objetivo, dibujar]);

  const lienzo = 'relative min-w-0 overflow-hidden rounded-md ring-1 ring-black/40';
  return (
    <div ref={caja} data-dock="motor"
      className={`relative flex shrink-0 border-t border-white/10 bg-[#0c1524] p-2 ${estrecho ? 'h-[164px] flex-col gap-1.5' : 'h-[clamp(140px,27%,188px)] gap-2.5'}`}>
      <Cifras reloj={reloj} compacto={estrecho} />
      <div className={`relative flex min-h-0 min-w-0 flex-1 ${estrecho ? 'flex-col' : 'gap-2'}`}>
        {estrecho && (
          <div className="absolute right-1 top-1 z-10 flex gap-0.5 rounded-md bg-[#0a1220]/90 p-0.5" role="tablist" aria-label="Gráfica">
            {(['par', 'omega'] as const).map((v) => (
              <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
                className={`h-[20px] rounded px-2 text-[10.5px] font-semibold ${vista === v ? 'bg-sky-400/25 text-white' : 'text-slate-400 hover:text-white'}`}>
                {v === 'par' ? 'τ(θ)' : 'ω(t)'}
              </button>
            ))}
          </div>
        )}
        <div ref={cajaA} className={`${lienzo} ${estrecho ? (vista === 'par' ? 'flex-1' : 'hidden') : 'flex-[1.2]'}`}>
          <canvas ref={lA} className="absolute inset-0 h-full w-full" role="img" aria-label="Par del motor frente al ángulo del inducido, con y sin conmutador, y par del freno" />
        </div>
        <div ref={cajaB} className={`${lienzo} ${estrecho ? (vista === 'omega' ? 'flex-1' : 'hidden') : 'flex-1'}`}>
          <canvas ref={lB} className="absolute inset-0 h-full w-full" role="img" aria-label="Velocidad en rpm y corriente frente al tiempo" />
        </div>
      </div>
    </div>
  );
}

/** Re-render a ≤ hz cuando el reloj integra (para trozos de React que dependen de él). */
export function useTickReloj(reloj: RelojMotor, hz = 8): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let t0 = 0;
    return reloj.suscribir(() => {
      const ahora = performance.now();
      if (ahora - t0 < 1000 / hz) return;
      t0 = ahora;
      setTick((n) => n + 1);
    });
  }, [reloj, hz]);
  return tick;
}
