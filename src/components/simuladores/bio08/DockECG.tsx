'use client';
/**
 * bio08/DockECG.tsx — la tira de papel del electrocardiógrafo y el lazo
 * vectorcardiográfico, dibujados en lienzos 2D (texto y cuadrícula nítidos).
 *
 * Papel milimetrado real: 25 mm por segundo DEL PACIENTE y 10 mm por mV; línea fina
 * cada 1 mm, gruesa cada 5 mm (0,2 s · 0,5 mV). El papel corre hacia la izquierda y
 * la pluma (el instante actual, el mismo de la escena) queda fija; con cámara lenta
 * el papel corre más despacio pero sigue midiendo en tiempo del paciente.
 *
 * Lo que NO hay a propósito: ni FC, ni intervalos, ni calibradores con número.
 * Se mide contando cuadros.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DERIVACIONES, VECTOR_DERIVACION, type Derivacion } from './electro';
import { PASO_MS, type RelojCardiaco } from './reloj';
import type { V3 } from './anatomia';

const MM_POR_S = 25;
const MM_POR_MV = 10;
/** Alto útil de la tira en mV (de −1,5 a +1,5). */
const RANGO_MV = 3.1;

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

/**
 * Escala del papel (px CSS por mm): la que quepa en el alto (±1,5 mV), pero sin bajar
 * de ≈ 4,2 s de tira a la vista (105 mm + la cabecera de 9 mm): con 30 lpm siguen
 * cabiendo dos ondas R para medir el R-R.
 */
export const pxPorMm = (alto: number, ancho: number) => Math.min(8, Math.max(3, Math.min(alto / (RANGO_MV * MM_POR_MV + 2), ancho / 114)));

function dibujarTira(cv: HTMLCanvasElement, w: number, h: number, reloj: RelojCardiaco | null, der: Derivacion) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d'); if (!g) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const W = cv.width, H = cv.height;
  const mm = pxPorMm(h, w) * dpr;               // px de dispositivo por mm
  const cab = Math.round(9 * mm);             // cabecera fija con el pulso de calibración
  const xPluma = Math.round(cab + (W - cab) * 0.86);
  const y0 = Math.round(H / 2 + 0.2 * MM_POR_MV * mm); // la línea base algo baja: el QRS sube más de lo que baja
  // papel
  g.fillStyle = '#fdf5f1'; g.fillRect(0, 0, W, H);
  const s = reloj ? (reloj.tPaciente * MM_POR_S) / 1000 : 0; // mm de papel recorridos
  const lineas = (cada: number, color: string, ancho: number) => {
    g.strokeStyle = color; g.lineWidth = ancho; g.beginPath();
    // verticales: posición en el papel u = k·cada; x = xPluma − (s − u)·mm
    const k0 = Math.ceil((s - (xPluma - cab) / mm) / cada), k1 = Math.floor((s + (W - xPluma) / mm) / cada);
    for (let k = k0; k <= k1; k++) { const x = Math.round(xPluma - (s - k * cada) * mm) + 0.5; if (x < cab) continue; g.moveTo(x, 0); g.lineTo(x, H); }
    // horizontales, ancladas a la línea base
    const j0 = Math.floor(-y0 / (cada * mm)), j1 = Math.ceil((H - y0) / (cada * mm));
    for (let j = j0; j <= j1; j++) { const y = Math.round(y0 + j * cada * mm) + 0.5; g.moveTo(cab, y); g.lineTo(W, y); }
    g.stroke();
  };
  if (mm >= 3.2) lineas(1, 'rgba(226,120,118,0.30)', Math.max(1, dpr * 0.6));
  lineas(5, 'rgba(206,74,74,0.62)', Math.max(1, Math.round(dpr)));
  // cabecera: pulso de calibración 1 mV × 0,2 s
  g.fillStyle = '#fbefe9'; g.fillRect(0, 0, cab, H);
  g.strokeStyle = 'rgba(206,74,74,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cab + 0.5, 0); g.lineTo(cab + 0.5, H); g.stroke();
  g.strokeStyle = '#1b2030'; g.lineWidth = Math.max(1.2, 1.3 * dpr); g.lineJoin = 'miter';
  g.beginPath();
  const xc = Math.round(1.5 * mm);
  g.moveTo(xc, y0); g.lineTo(xc + 1.5 * mm, y0); g.lineTo(xc + 1.5 * mm, y0 - MM_POR_MV * mm); g.lineTo(xc + 6.5 * mm, y0 - MM_POR_MV * mm); g.lineTo(xc + 6.5 * mm, y0); g.lineTo(cab - 0.5 * mm, y0);
  g.stroke();
  // rótulo de la derivación
  g.fillStyle = '#1b2030'; g.font = `600 ${Math.round(11 * dpr)}px Outfit, system-ui, sans-serif`; g.textBaseline = 'top';
  g.fillText(der, cab + Math.round(2 * mm), Math.round(1.2 * mm));
  if (!reloj || !reloj.modelo) return;
  // trazo: muestras cada PASO_MS hacia atrás desde la pluma
  const u = VECTOR_DERIVACION[der];
  const pasoX = (PASO_MS / 1000) * MM_POR_S * mm;
  const n = Math.min(reloj.escritas, Math.ceil((xPluma - cab) / pasoX) + 2);
  const D: V3 = [0, 0, 0];
  g.save();
  g.beginPath(); g.rect(cab + 1, 0, W - cab, H); g.clip();
  g.strokeStyle = '#151a2b'; g.lineWidth = Math.max(1.3, 1.45 * dpr); g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath();
  let yAhora = y0;
  for (let k = 0; k < n; k++) {
    if (!reloj.muestra(k, D)) break;
    const v = D[0] * u[0] + D[1] * u[1] + D[2] * u[2];
    const x = xPluma - k * pasoX, y = y0 - v * MM_POR_MV * mm;
    if (k === 0) { g.moveTo(x, y); yAhora = y; } else g.lineTo(x, y);
  }
  g.stroke();
  g.restore();
  // pluma: el cursor de tiempo compartido con la escena
  g.strokeStyle = 'rgba(28,110,160,0.28)'; g.lineWidth = Math.max(1, dpr); g.beginPath(); g.moveTo(xPluma + 0.5, 0); g.lineTo(xPluma + 0.5, H); g.stroke();
  const grad = g.createRadialGradient(xPluma, yAhora, 0, xPluma, yAhora, 7 * dpr);
  grad.addColorStop(0, 'rgba(255,170,60,0.9)'); grad.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = grad; g.beginPath(); g.arc(xPluma, yAhora, 7 * dpr, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c2410c'; g.beginPath(); g.arc(xPluma, yAhora, 2.4 * dpr, 0, Math.PI * 2); g.fill();
}

const ANG: Record<Derivacion, number> = { I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90 };

function dibujarVCG(cv: HTMLCanvasElement, lado: number, reloj: RelojCardiaco | null, der: Derivacion) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(lado * dpr);
  if (cv.width !== W || cv.height !== W) { cv.width = W; cv.height = W; }
  const g = cv.getContext('2d'); if (!g) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#0a1220'; g.fillRect(0, 0, W, W);
  const c = W / 2, R = W * 0.36, esc = R / 1.6; // 1,6 mV al borde del círculo
  g.strokeStyle = 'rgba(148,180,205,0.18)'; g.lineWidth = Math.max(1, dpr);
  g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.stroke();
  g.font = `600 ${Math.round(9 * dpr)}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const d of DERIVACIONES) {
    const a = (ANG[d] * Math.PI) / 180, x = Math.cos(a), y = Math.sin(a); // ángulo hexaxial: positivo hacia abajo
    const sel = d === der;
    g.strokeStyle = sel ? 'rgba(215,240,255,0.85)' : 'rgba(148,180,205,0.22)'; g.lineWidth = (sel ? 1.6 : 1) * dpr;
    g.beginPath(); g.moveTo(c - x * R, c - y * R); g.lineTo(c + x * R, c + y * R); g.stroke();
    g.fillStyle = sel ? '#e6f6ff' : 'rgba(170,196,214,0.65)';
    g.fillText(d, c + x * (R + 9 * dpr), c + y * (R + 8 * dpr));
  }
  if (!reloj || !reloj.modelo) return;
  // lazo del último ciclo (más reciente = más claro)
  const n = Math.min(reloj.escritas, Math.round(reloj.rr / PASO_MS));
  const D: V3 = [0, 0, 0];
  let px = 0, py = 0;
  g.lineWidth = Math.max(1, 1.4 * dpr); g.lineCap = 'round';
  for (let k = n - 1; k >= 0; k--) {
    if (!reloj.muestra(k, D)) continue;
    const x = c + D[0] * esc, y = c - D[1] * esc;
    if (k < n - 1) {
      const a = 0.15 + 0.85 * (1 - k / n);
      g.strokeStyle = `rgba(255,${Math.round(170 + 60 * a)},${Math.round(90 + 80 * a)},${a.toFixed(3)})`;
      g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
    }
    px = x; py = y;
  }
  // vector actual y su proyección en la derivación elegida
  const v = reloj.D, x = c + v[0] * esc, y = c - v[1] * esc;
  const a = (ANG[der] * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a);
  const p = (v[0] * ux - v[1] * uy) * esc; // D·û en el plano de la pantalla (y hacia abajo)
  g.strokeStyle = p >= 0 ? 'rgba(255,190,90,0.95)' : 'rgba(110,170,255,0.95)'; g.lineWidth = 3.2 * dpr;
  g.beginPath(); g.moveTo(c, c); g.lineTo(c + ux * p, c + uy * p); g.stroke();
  g.strokeStyle = 'rgba(255,240,215,0.95)'; g.lineWidth = 1.6 * dpr;
  g.beginPath(); g.moveTo(c, c); g.lineTo(x, y); g.stroke();
  g.fillStyle = '#fff1d6'; g.beginPath(); g.arc(x, y, 2.6 * dpr, 0, Math.PI * 2); g.fill();
}

export default function DockECG({ reloj, derivacion, onDerivacion, listo }: {
  reloj: RelojCardiaco; derivacion: Derivacion; onDerivacion: (d: Derivacion) => void; listo: boolean;
}) {
  const [cont, tamCont] = useTamano<HTMLDivElement>();
  const [caja, tam] = useTamano<HTMLDivElement>();
  const tira = useRef<HTMLCanvasElement>(null);
  const vcg = useRef<HTMLCanvasElement>(null);
  const conVCG = tamCont.w >= 560;
  const derRef = useRef(derivacion); derRef.current = derivacion;
  const dibujar = useCallback(() => {
    const r = listo ? reloj : null;
    if (tira.current && tam.w > 0) dibujarTira(tira.current, tam.w, tam.h, r, derRef.current);
    if (vcg.current && conVCG && tam.h > 0) dibujarVCG(vcg.current, tam.h, r, derRef.current);
  }, [reloj, listo, tam.w, tam.h, conVCG]);
  useEffect(() => { dibujar(); return reloj.suscribir(dibujar); }, [reloj, dibujar]);
  useEffect(() => { dibujar(); }, [derivacion, dibujar]);
  return (
    <div ref={cont} className="flex h-[clamp(128px,27%,212px)] shrink-0 gap-2 border-t border-white/10 bg-[#0c1524] p-2" data-dock="ecg">
      <div className="grid shrink-0 grid-cols-2 content-center gap-1" role="group" aria-label="Derivación">
        {DERIVACIONES.map((d) => (
          <button key={d} type="button" onClick={() => onDerivacion(d)} aria-pressed={d === derivacion}
            className={`h-7 w-10 rounded-md border text-[11px] font-semibold transition-colors ${d === derivacion ? 'border-sky-300/70 bg-sky-400/20 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'}`}>
            {d}
          </button>
        ))}
      </div>
      <div ref={caja} className="relative min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-black/40">
        <canvas ref={tira} className="absolute inset-0 h-full w-full" role="img" aria-label={`Tira de ECG, derivación ${derivacion}, 25 mm/s y 10 mm/mV`} />
      </div>
      {conVCG && (
        <div className="relative aspect-square h-full shrink-0 overflow-hidden rounded-md ring-1 ring-white/10" title="Vectorcardiograma frontal: lazo del último latido y su proyección en la derivación elegida">
          <canvas ref={vcg} className="absolute inset-0 h-full w-full" role="img" aria-label="Lazo vectorcardiográfico en el plano frontal" />
        </div>
      )}
    </div>
  );
}
