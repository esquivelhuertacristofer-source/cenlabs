'use client';
/**
 * mat06/Dock.tsx — el dock DOM bajo la escena. Lee EL MISMO reloj que la escena: cada cuadro
 * del reloj avisa y el dock se redibuja con ese estado (≤ 30 Hz el lienzo, ≤ 15 Hz las cifras).
 *
 *  · Matriz: la 3×3 homogénea de la pose de ESTE cuadro (bloque lineal 2×2 en blanco,
 *    columna de traslación en ámbar) y su determinante con signo: factor de área y
 *    orientación. En la composición, T·R y R·T lado a lado: mismo bloque 2×2 al llegar,
 *    distinta columna de traslación.
 *  · Base: el cuadrado unidad (e₁, e₂) y su imagen, el paralelogramo de las columnas Me₁ y
 *    Me₂. Su área con signo ES el determinante: en la reflexión se aplasta y se da la vuelta.
 *  · Coordenadas: los puntos clave A, B, C y el pivote P, original → ahora (M·punto).
 *    En el reto, de la pieza a TU placa: nunca la silueta objetivo.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { RelojTransf } from './reloj';
import { det2, num, type Mat3 } from './transformaciones';
import { COLOR } from './banco';

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

/** Re-render a ≤ hz cuando el reloj avisa (trozos de React que dependen de él). */
export function useTickReloj(reloj: RelojTransf, hz = 6): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let t0 = 0, pendiente = 0;
    const f = () => {
      const ahora = performance.now();
      if (ahora - t0 < 1000 / hz) {
        // el último aviso (la llegada, la pausa) no se pierde
        if (!pendiente) pendiente = window.setTimeout(() => { pendiente = 0; t0 = performance.now(); setTick((n) => n + 1); }, 1000 / hz);
        return;
      }
      t0 = ahora;
      setTick((n) => n + 1);
    };
    const fuera = reloj.suscribir(f);
    return () => { fuera(); window.clearTimeout(pendiente); };
  }, [reloj, hz]);
  return tick;
}

const FUENTE = (px: number, peso = 500) => `${peso} ${px}px Outfit, system-ui, sans-serif`;
const colDet = (d: number) => (d > 5e-3 ? '#34d399' : d < -5e-3 ? '#f472b6' : '#94a3b8');

// ───────────────────────────── matriz ─────────────────────────────

function Matriz({ M, titulo, color, compacto }: { M: Mat3; titulo: string; color?: string; compacto: boolean }) {
  const celda = `text-right font-mono tabular-nums ${compacto ? 'text-[11.5px]' : 'text-[13px]'} font-semibold leading-[1.35]`;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-mono font-bold ${compacto ? 'text-[13px]' : 'text-[15px]'}`} style={{ color: color ?? '#e2e8f0' }}>{titulo}</span>
      <div className={`grid grid-cols-3 rounded-[5px] border-x-2 border-slate-300/50 ${compacto ? 'gap-x-1.5 px-1.5' : 'gap-x-2.5 px-2'} py-0.5`} data-matriz-m6={titulo}>
        {[0, 1, 2].map((i) => [0, 1, 2].map((j) => (
          <span key={`${i}${j}`} className={celda}
            style={{ color: i === 2 ? 'rgba(148,163,184,0.7)' : j === 2 ? COLOR.imagen : '#f8fafc' }}>
            {i === 2 ? String(M[i][j]) : num(M[i][j], 2)}
          </span>
        )))}
      </div>
    </div>
  );
}

function Det({ d, compacto }: { d: number; compacto: boolean }) {
  const texto = d > 5e-3 ? 'orientación igual' : d < -5e-3 ? 'orientación invertida' : 'área 0: sin inversa';
  return (
    <div className="flex flex-col leading-tight" title="|det| = área de la imagen ÷ área de la figura; el signo dice si la orientación se conserva">
      <span className="text-[10.5px] font-semibold text-slate-400">det</span>
      <span className={`font-mono font-bold tabular-nums ${compacto ? 'text-[15px]' : 'text-[18px]'}`} style={{ color: colDet(d) }} data-det-m6="">{num(d, 2, true)}</span>
      <span className="text-[10px] text-slate-400">{texto}</span>
    </div>
  );
}

function BloqueMatriz({ reloj, compacto }: { reloj: RelojTransf; compacto: boolean }) {
  useTickReloj(reloj, 15);
  const l = reloj.lectura();
  if (l.M2) {
    return (
      <div className="flex shrink-0 flex-col justify-center gap-1" data-bloque-matriz="">
        <div className="flex items-center gap-2"><Matriz M={l.M} titulo="T·R" color={COLOR.imagen} compacto /><Det d={l.det} compacto /></div>
        <div className="flex items-center gap-2"><Matriz M={l.M2} titulo="R·T" color={COLOR.rama2} compacto /><Det d={l.det2 ?? 0} compacto /></div>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-3" data-bloque-matriz="">
      <Matriz M={l.M} titulo="M" compacto={compacto} />
      <Det d={l.det} compacto={compacto} />
    </div>
  );
}

// ───────────────────────────── base: el paralelogramo del determinante ─────────────────────────────

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

/** Alcance del paralelogramo de las columnas (para escalar el lienzo). */
function alcance(M: Mat3): number {
  const a = M[0][0], c = M[1][0], b = M[0][1], d = M[1][1];
  return Math.max(1, Math.abs(a), Math.abs(c), Math.abs(b), Math.abs(d), Math.abs(a + b), Math.abs(c + d));
}

function dibujarBase(cv: HTMLCanvasElement, w: number, h: number, reloj: RelojTransf) {
  const g = preparar(cv, w, h); if (!g) return;
  const l = reloj.lectura();
  // escala fija por estación (la de la matriz de llegada): el paralelogramo se mueve, la rejilla no
  const R_BASE = Math.max(1.7, 1.18 * Math.max(alcance(reloj.matrizFinal(0)), l.M2 ? alcance(reloj.matrizFinal(1)) : 1));
  const arriba = 18, lado = Math.max(40, Math.min(w - 12, h - arriba - 6));
  const s = lado / (2 * R_BASE);
  const cx = w / 2, cy = arriba + lado / 2;
  const X = (x: number) => cx + x * s, Y = (y: number) => cy - y * s;
  // rejilla y ejes
  g.strokeStyle = 'rgba(148,180,205,0.12)'; g.lineWidth = 1; g.beginPath();
  for (let k = -Math.floor(R_BASE); k <= Math.floor(R_BASE); k++) { g.moveTo(Math.round(X(k)) + 0.5, Y(R_BASE)); g.lineTo(Math.round(X(k)) + 0.5, Y(-R_BASE)); g.moveTo(X(-R_BASE), Math.round(Y(k)) + 0.5); g.lineTo(X(R_BASE), Math.round(Y(k)) + 0.5); }
  g.stroke();
  g.strokeStyle = 'rgba(170,196,214,0.4)'; g.beginPath();
  g.moveTo(X(-R_BASE), Math.round(Y(0)) + 0.5); g.lineTo(X(R_BASE), Math.round(Y(0)) + 0.5);
  g.moveTo(Math.round(X(0)) + 0.5, Y(-R_BASE)); g.lineTo(Math.round(X(0)) + 0.5, Y(R_BASE));
  g.stroke();
  // el cuadrado unidad (a trazos)
  g.setLineDash([3, 3]); g.strokeStyle = 'rgba(56,217,245,0.75)'; g.lineWidth = 1.2;
  g.strokeRect(X(0), Y(1), s, s); g.setLineDash([]);
  const flechita = (x: number, y: number, color: string) => {
    const L = Math.hypot(x, y); if (L * s < 4) return;
    const ux = x / L, uy = y / L;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2;
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(x) - ux * 4, Y(y) + uy * 4); g.stroke();
    const px = X(x), py = Y(y), a = Math.atan2(-uy, ux);
    g.beginPath(); g.moveTo(px, py);
    g.lineTo(px - 8 * Math.cos(a - 0.4), py - 8 * Math.sin(a - 0.4));
    g.lineTo(px - 8 * Math.cos(a + 0.4), py - 8 * Math.sin(a + 0.4));
    g.closePath(); g.fill();
  };
  const paralelogramo = (M: Mat3, borde: string, rayas: boolean) => {
    const a = M[0][0], c = M[1][0], b = M[0][1], d = M[1][1];
    const det = det2(M);
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(a), Y(c)); g.lineTo(X(a + b), Y(c + d)); g.lineTo(X(b), Y(d)); g.closePath();
    if (!rayas) { g.fillStyle = det > 5e-3 ? 'rgba(52,211,153,0.22)' : det < -5e-3 ? 'rgba(244,114,182,0.26)' : 'rgba(148,163,184,0.2)'; g.fill(); }
    g.strokeStyle = borde; g.lineWidth = 1.3; g.setLineDash(rayas ? [4, 3] : []); g.stroke(); g.setLineDash([]);
    if (!rayas) { flechita(a, c, COLOR.A); flechita(b, d, COLOR.B); }
  };
  g.save(); g.beginPath(); g.rect(X(-R_BASE), Y(R_BASE), 2 * R_BASE * s, 2 * R_BASE * s); g.clip();
  if (l.M2) paralelogramo(l.M2, 'rgba(255,79,163,0.85)', true);
  paralelogramo(l.M, 'rgba(226,232,240,0.7)', false);
  g.restore();
  // títulos
  g.font = FUENTE(10.5, 700); g.fillStyle = 'rgba(214,228,240,0.88)'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('Base', 6, 9);
  const x0 = 6 + g.measureText('Base').width + 8;
  g.font = FUENTE(10, 600);
  g.fillStyle = COLOR.A; g.fillText('Me₁', x0, 9);
  g.fillStyle = COLOR.B; g.fillText('Me₂', x0 + g.measureText('Me₁').width + 7, 9);
}

// ───────────────────────────── coordenadas ─────────────────────────────

function Tabla({ reloj, compacto }: { reloj: RelojTransf; compacto: boolean }) {
  useTickReloj(reloj, 10);
  const l = reloj.lectura();
  const comp = !!l.M2;
  const reto = l.modo === 'reto';
  const dec = compacto && comp ? 1 : 2;
  const par = (p: [number, number]) => `${num(p[0], dec)}; ${num(p[1], dec)}`;
  const cols = reto ? ['pieza', 'tu placa'] : comp ? ['original', 'T·R', 'R·T'] : ['original', 'ahora'];
  const th = 'pb-0.5 text-left text-[10px] font-semibold text-slate-400';
  const td = `py-[1px] pr-2 font-mono ${compacto ? 'text-[10.5px]' : 'text-[11.5px]'} tabular-nums whitespace-nowrap`;
  return (
    <div className="flex min-w-0 flex-col" data-tabla-m6="">
      <span className="mb-0.5 text-[10.5px] font-bold text-slate-200">Coordenadas</span>
      <table className="border-separate border-spacing-0">
        <thead><tr><th className={th} />{cols.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
        <tbody>
          {l.puntos.map((q) => (
            <tr key={q.id}>
              <td className="pr-1.5"><span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold" style={{ color: COLOR[q.id] }}><i className="inline-block h-2 w-2 rounded-full" style={{ background: COLOR[q.id], boxShadow: `0 0 5px ${COLOR[q.id]}` }} />{q.id}</span></td>
              <td className={`${td} text-slate-300`}>{par(q.orig)}</td>
              <td className={`${td} text-white`} style={comp ? { color: COLOR.imagen } : undefined}>{par(q.ahora)}</td>
              {comp && q.ahora2 && <td className={td} style={{ color: COLOR.rama2 }}>{par(q.ahora2)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────────── el dock ─────────────────────────────

type Vista = 'base' | 'tabla';

export function DockTransf({ reloj }: { reloj: RelojTransf }) {
  const [caja, tam] = useTamano<HTMLDivElement>();
  const estrecho = tam.w > 0 && tam.w < 640;
  const [vista, setVista] = useState<Vista>('base');
  const [cajaB, tamB] = useTamano<HTMLDivElement>();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const ultimo = useRef(0), pendiente = useRef(0);
  const dibujar = useCallback((forzar = false) => {
    const ahora = performance.now();
    if (!forzar && ahora - ultimo.current < 33) {
      if (!pendiente.current) pendiente.current = window.setTimeout(() => { pendiente.current = 0; dibujarRef.current(true); }, 33 - (ahora - ultimo.current));
      return;
    }
    ultimo.current = ahora;
    if ((!estrecho || vista === 'base') && lienzo.current && tamB.w > 0) dibujarBase(lienzo.current, tamB.w, tamB.h, reloj);
  }, [reloj, tamB.w, tamB.h, estrecho, vista]);
  const dibujarRef = useRef(dibujar);
  useEffect(() => { dibujarRef.current = dibujar; }, [dibujar]);
  useEffect(() => { dibujar(true); return reloj.suscribir(() => dibujar()); }, [reloj, dibujar]);
  useEffect(() => () => window.clearTimeout(pendiente.current), []);

  const pestanas: [Vista, string][] = [['base', 'Base'], ['tabla', 'Coordenadas']];
  return (
    <div ref={caja} data-dock="m6"
      className={`relative flex shrink-0 gap-3 border-t border-white/10 bg-[#0c1524] px-2.5 py-2 ${estrecho ? 'h-[170px]' : 'h-[clamp(150px,25%,186px)]'}`}>
      <BloqueMatriz reloj={reloj} compacto={estrecho} />
      {estrecho && (
        <div className="absolute right-2 top-1.5 z-10 flex gap-0.5 rounded-md bg-[#0a1220]/90 p-0.5" role="tablist" aria-label="Instrumento">
          {pestanas.map(([v, t]) => (
            <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
              className={`h-[20px] rounded px-2 text-[10.5px] font-semibold ${vista === v ? 'bg-sky-400/25 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
      )}
      <div ref={cajaB} className={`relative min-w-0 overflow-hidden rounded-md ring-1 ring-black/40 ${estrecho ? (vista === 'base' ? (tam.w < 470 ? 'mt-6 flex-1' : 'flex-1') : 'hidden') : 'aspect-square h-full shrink-0'}`}>
        <canvas ref={lienzo} className="absolute inset-0 h-full w-full" role="img"
          aria-label="El cuadrado unidad y su imagen: el paralelogramo de las columnas de la matriz; su área con signo es el determinante" />
      </div>
      <div className={`min-w-0 ${estrecho ? (vista === 'tabla' ? 'flex-1 pt-5' : 'hidden') : 'flex-1'}`}>
        <Tabla reloj={reloj} compacto={estrecho} />
      </div>
    </div>
  );
}
