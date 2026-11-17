'use client';
/**
 * bio01/CampoOcular.tsx — lo que se ve POR EL OCULAR: el protagonista del lab.
 *
 * Lienzos 2D apilados dentro de un campo circular. Cada preparación (visor/*.ts)
 * dibuja en micrómetros reales, por capas de distinta altura:
 *   · las capas FIJAS se pintan por teselas de 256 px y se guardan en caché: mover
 *     la platina sólo recoloca teselas, y a 4× una lámina con cientos de miles de
 *     células se dibuja una sola vez;
 *   · la capa VIVA (agua de estanque) se simula y redibuja en cada cuadro.
 * Las capas se multiplican sobre el fondo iluminado (luz transmitida) y cada una
 * lleva su propio desenfoque: el que el DOMINIO calcula con el error de enfoque, la
 * apertura numérica y la altura de la capa. Brillo y contraste también son del dominio.
 *
 * Encima, sin desenfocar: barra de escala, marco de conteo, regla y marcas.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { MuestraB1, ObjetivoMagB1 } from '@/store/types';
import { barraEscalaUm, campoUm, ladoMarcoUm } from '@/domain/microscopia/optica';
import type { Preparacion, Vista } from './visor/pincel';
import { ESTANQUE_PREP } from './visor/estanque';
import { SANGRE_PREP } from './visor/sangre';
import { GRAM_PREP } from './visor/gram';
import { MITOSIS_PREP } from './visor/mitosis';
import { CEBOLLA_PREP, ESTOMAS_PREP } from './visor/vegetales';

export const PREPARACIONES: Record<MuestraB1, Preparacion> = {
  estanque: ESTANQUE_PREP, sangre: SANGRE_PREP, gram: GRAM_PREP, mitosis: MITOSIS_PREP, cebolla: CEBOLLA_PREP, estomas: ESTOMAS_PREP,
};

export type Herramienta = 'mover' | 'medir' | 'marcar';
export interface Medida { ax: number; ay: number; bx: number; by: number }
export interface Marca { x: number; y: number; cat: number }
export const COLORES_MARCA = ['#ff4d6d', '#22d3ee', '#facc15'];

export interface CampoOcularProps {
  caso: MuestraB1;
  semilla: number;
  mag: ObjetivoMagB1;
  /** centro del campo en la preparación (µm) */
  posX: number;
  posY: number;
  /** desenfoque del dominio (px para un visor de 720 px) de una capa a la altura z (µm) */
  desenfoque: (zUm: number) => number;
  /** resolución (µm): emborrona lo que la óptica no separa */
  resolucionUm: number;
  /** brillo efectivo del dominio (60 = imagen normal) */
  brillo: number;
  /** contraste relativo del dominio (1 = neutro) */
  contraste: number;
  /** % del reóstato: una lámpara baja da luz más cálida */
  lampara: number;
  /** objetivo de inmersión sin aceite: velo lechoso */
  lechoso: boolean;
  congelado: boolean;
  herramienta: Herramienta;
  marco: boolean;
  medida: Medida | null;
  marcas: Marca[];
  onMedida: (m: Medida | null) => void;
  onMarca: (x: number, y: number) => void;
  /** arrastre de la platina (µm) */
  onMover: (dx: number, dy: number) => void;
  /** rueda del ratón: pasos del micrométrico */
  onEnfoque: (pasos: number) => void;
}

export interface CampoOcularRef { capturar: () => string | null }

// ───────────────────────────── caché de teselas ─────────────────────────────

const T = 256;
const MAX_TESELAS = 260;
const teselas = new Map<string, HTMLCanvasElement>();

function tesela(prep: Preparacion, capa: number, clave: string, tx: number, ty: number, s: number, semilla: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = T; cv.height = T;
  const g = cv.getContext('2d');
  if (g) {
    g.setTransform(s, 0, 0, s, -tx * T, -ty * T);
    const v: Vista = { rect: { x0: (tx * T) / s, y0: (ty * T) / s, x1: ((tx + 1) * T) / s, y1: ((ty + 1) * T) / s }, s, semilla };
    try { prep.capas[capa].dibujar(g, v); } catch { /* una tesela fallida no tumba el visor */ }
  }
  if (teselas.size >= MAX_TESELAS) {
    // se descarta lo más antiguo (Map conserva el orden de inserción)
    let n = 60;
    for (const k of teselas.keys()) { teselas.delete(k); if (--n <= 0) break; }
  }
  teselas.set(clave, cv);
  return cv;
}

/** Grano del sensor: mosaico de ruido que se genera una vez. */
let granoUrl: string | null = null;
function grano(): string {
  if (granoUrl) return granoUrl;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  if (g) {
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 110; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  }
  granoUrl = cv.toDataURL('image/png');
  return granoUrl;
}

const PAD = 26; // px CSS de lienzo que sobra alrededor del campo (lo come el desenfoque)

function fmtUm(um: number): string {
  if (um >= 1000) return `${String(Math.round(um / 10) / 100).replace('.', ',')} mm`;
  return `${um < 20 ? String(Math.round(um * 10) / 10).replace('.', ',') : Math.round(um)} µm`;
}

const CampoOcular = forwardRef<CampoOcularRef, CampoOcularProps>(function CampoOcular(p, ref) {
  const cont = useRef<HTMLDivElement>(null);
  const [D, setD] = useState(0);
  useEffect(() => {
    const el = cont.current; if (!el) return;
    const medir = () => { const r = el.getBoundingClientRect(); setD(Math.max(0, Math.floor(Math.min(r.width, r.height)) - 10)); };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const prep = PREPARACIONES[p.caso];
  const dpr = typeof window === 'undefined' ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
  const sCss = D > 0 ? D / campoUm(p.mag) : 1;       // px CSS por µm
  const lado = D + 2 * PAD;                           // lado CSS de cada lienzo
  const ladoDev = Math.round(lado * dpr);

  const fijas = useRef<(HTMLCanvasElement | null)[]>([]);
  const viva = useRef<HTMLCanvasElement>(null);
  const estado = useRef<{ clave: string; e: unknown } | null>(null);
  // lo que lee el bucle de dibujo (sin re-suscribirse en cada render)
  const vivo = useRef({ p, D, dpr, ladoDev, sucio: true, t: 0 });
  vivo.current = { ...vivo.current, p, D, dpr, ladoDev, sucio: true };

  useEffect(() => {
    let raf = 0, previo = performance.now();
    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      const c = vivo.current;
      const intervalo = ahora - previo;
      const dt = Math.min(0.05, intervalo / 1000); previo = ahora;
      if (c.D <= 0) return;
      const q = c.p, pr = PREPARACIONES[q.caso];
      const s = (c.D * c.dpr) / campoUm(q.mag);
      const ox = Math.round(q.posX * s - c.ladoDev / 2), oy = Math.round(q.posY * s - c.ladoDev / 2);
      // ── capas fijas: sólo cuando cambia la vista o faltan teselas ──
      if (c.sucio) {
        let completo = true;
        // presupuesto por cuadro: 12 ms si la animación va fluida; más si el equipo va lento
        // (así una lámina densa a 4× no tarda decenas de cuadros en completarse)
        const limite = performance.now() + Math.min(90, Math.max(12, intervalo * 0.6));
        const esc = s.toFixed(5);
        pr.capas.forEach((capa, k) => {
          const cv = fijas.current[k]; if (!cv) { completo = false; return; }
          if (cv.width !== c.ladoDev || cv.height !== c.ladoDev) { cv.width = c.ladoDev; cv.height = c.ladoDev; }
          const g = cv.getContext('2d'); if (!g) return;
          g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
          const tx0 = Math.floor(ox / T), tx1 = Math.floor((ox + c.ladoDev - 1) / T), ty0 = Math.floor(oy / T), ty1 = Math.floor((oy + c.ladoDev - 1) / T);
          // del centro hacia afuera: lo primero que aparece es lo que se mira
          const lista: [number, number, number][] = [];
          for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) lista.push([tx, ty, Math.hypot((tx + 0.5) * T - ox - c.ladoDev / 2, (ty + 0.5) * T - oy - c.ladoDev / 2)]);
          lista.sort((a, b) => a[2] - b[2]);
          let hechas = 0;
          for (const [tx, ty] of lista) {
            const clave = `${q.caso}|${q.semilla}|${capa.id}|${esc}|${tx}|${ty}`;
            let t = teselas.get(clave);
            if (!t) {
              if (hechas > 0 && performance.now() > limite) { completo = false; continue; }
              t = tesela(pr, k, clave, tx, ty, s, q.semilla); hechas++;
            }
            g.drawImage(t, tx * T - ox, ty * T - oy);
          }
        });
        c.sucio = !completo;
      }
      // ── capa viva ──
      const cv = viva.current;
      if (pr.viva && cv) {
        const clave = `${q.caso}|${q.semilla}`;
        if (!estado.current || estado.current.clave !== clave) estado.current = { clave, e: pr.viva.crear(q.semilla) };
        if (!q.congelado) { pr.viva.paso(estado.current.e, dt); c.t += dt; }
        if (cv.width !== c.ladoDev || cv.height !== c.ladoDev) { cv.width = c.ladoDev; cv.height = c.ladoDev; }
        const g = cv.getContext('2d');
        if (g) {
          g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
          g.setTransform(s, 0, 0, s, -ox, -oy);
          pr.viva.dibujar(g, { rect: { x0: ox / s, y0: oy / s, x1: (ox + c.ladoDev) / s, y1: (oy + c.ladoDev) / s }, s, semilla: q.semilla }, estado.current.e, c.t);
        }
      }
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── óptica aplicada (los números vienen del dominio) ──
  const escala = D / 720;
  const blur = (z: number) => Math.hypot(p.desenfoque(z) * escala, 0.4 * p.resolucionUm * sCss);
  // Suelo de 0,5 px: ni la mejor óptica ni el sensor dan un borde de un solo píxel.
  const filtroCapa = (z: number) => `blur(${Math.max(0.5, blur(z)).toFixed(2)}px)`;
  const brilloCss = Math.min(1.9, Math.max(0.04, p.brillo / 60));
  const calidez = Math.min(1, Math.max(0, p.lampara / 100));
  const luz = `rgb(255,${Math.round(206 + 49 * Math.min(1, calidez * 1.25))},${Math.round(150 + 105 * Math.min(1, calidez * 1.25))})`;

  useImperativeHandle(ref, () => ({
    capturar: () => {
      if (D <= 0) return null;
      const N = 360, k = N / D;
      const a = document.createElement('canvas'); a.width = a.height = N;
      const g = a.getContext('2d'); if (!g) return null;
      g.fillStyle = prep.fondo; g.fillRect(0, 0, N, N);
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = luz; g.fillRect(0, 0, N, N);
      const poner = (cv: HTMLCanvasElement | null, z: number) => {
        if (!cv || !cv.width) return;
        const b = blur(z) * k;
        g.filter = b > 0.2 ? `blur(${b.toFixed(2)}px)` : 'none';
        g.drawImage(cv, -PAD * k, -PAD * k, lado * k, lado * k);
      };
      prep.capas.forEach((c, i) => poner(fijas.current[i], c.z));
      if (prep.viva) poner(viva.current, prep.viva.z);
      const b = document.createElement('canvas'); b.width = b.height = N;
      const h = b.getContext('2d'); if (!h) return null;
      h.fillStyle = '#05070a'; h.fillRect(0, 0, N, N);
      h.save(); h.beginPath(); h.arc(N / 2, N / 2, N / 2 - 2, 0, Math.PI * 2); h.clip();
      h.filter = `contrast(${p.contraste.toFixed(2)}) brightness(${brilloCss.toFixed(2)})`;
      h.drawImage(a, 0, 0);
      h.filter = 'none';
      const vg = h.createRadialGradient(N / 2, N / 2, N * 0.3, N / 2, N / 2, N / 2);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      h.fillStyle = vg; h.fillRect(0, 0, N, N);
      h.restore();
      const barra = barraEscalaUm(p.mag), px = barra * sCss * k;
      h.fillStyle = 'rgba(8,10,14,0.72)'; h.fillRect(N / 2 - px / 2 - 8, N * 0.82 - 16, px + 16, 30);
      h.fillStyle = '#fff'; h.fillRect(N / 2 - px / 2, N * 0.82 + 6, px, 3);
      h.font = '600 13px sans-serif'; h.textAlign = 'center'; h.fillText(fmtUm(barra), N / 2, N * 0.82);
      try { return b.toDataURL('image/jpeg', 0.84); } catch { return null; }
    },
  }));

  // ── interacción ──
  const campo = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  const [trazo, setTrazo] = useState<Medida | null>(null);
  const aMundo = (e: { clientX: number; clientY: number }) => {
    const r = campo.current!.getBoundingClientRect();
    return { x: p.posX + (e.clientX - r.left - r.width / 2) / sCss, y: p.posY + (e.clientY - r.top - r.height / 2) / sCss };
  };
  const abajo = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (p.herramienta === 'mover') arrastre.current = { x: e.clientX, y: e.clientY };
    else if (p.herramienta === 'medir') { const w = aMundo(e); setTrazo({ ax: w.x, ay: w.y, bx: w.x, by: w.y }); p.onMedida(null); }
    else { const w = aMundo(e); p.onMarca(w.x, w.y); }
  };
  const mueve = (e: React.PointerEvent) => {
    if (p.herramienta === 'mover' && arrastre.current) {
      const dx = e.clientX - arrastre.current.x, dy = e.clientY - arrastre.current.y;
      arrastre.current = { x: e.clientX, y: e.clientY };
      if (dx || dy) p.onMover(-dx / sCss, -dy / sCss);
    } else if (p.herramienta === 'medir' && trazo) { const w = aMundo(e); setTrazo({ ...trazo, bx: w.x, by: w.y }); }
  };
  const arriba = () => {
    arrastre.current = null;
    if (trazo) { if (Math.hypot(trazo.bx - trazo.ax, trazo.by - trazo.ay) * sCss > 4) p.onMedida(trazo); setTrazo(null); }
  };
  const enfoque = useRef(p.onEnfoque);
  enfoque.current = p.onEnfoque;
  useEffect(() => {
    const el = campo.current; if (!el) return;
    const rueda = (e: WheelEvent) => { e.preventDefault(); enfoque.current(e.deltaY > 0 ? -1 : 1); };
    el.addEventListener('wheel', rueda, { passive: false });
    return () => el.removeEventListener('wheel', rueda);
  }, [D]);
  const tecla = (e: React.KeyboardEvent) => {
    const paso = campoUm(p.mag) * 0.06;
    const d: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
    if (d[e.key]) { e.preventDefault(); p.onMover(d[e.key][0], d[e.key][1]); }
  };

  const aPx = (x: number, y: number): [number, number] => [D / 2 + (x - p.posX) * sCss, D / 2 + (y - p.posY) * sCss];
  const med = trazo ?? p.medida;
  const barra = barraEscalaUm(p.mag);
  const marcoPx = ladoMarcoUm(p.mag) * sCss;
  const granoCss = useMemo(() => (typeof document === 'undefined' ? '' : `url(${grano()})`), []);
  const cambio = useRef(0);
  const claveCambio = `${p.caso}-${p.mag}`;
  const previa = useRef(claveCambio);
  if (previa.current !== claveCambio) { previa.current = claveCambio; cambio.current++; }

  return (
    <div ref={cont} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {D > 60 && (
        <div
          ref={campo} role="application" tabIndex={0} data-campo-ocular=""
          aria-label="Campo del ocular. Arrastra para mover la platina; la rueda afina el enfoque."
          onPointerDown={abajo} onPointerMove={mueve} onPointerUp={arriba} onPointerCancel={arriba} onKeyDown={tecla}
          className="relative shrink-0 select-none overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{ width: D, height: D, touchAction: 'none', cursor: p.herramienta === 'mover' ? 'grab' : 'crosshair', boxShadow: '0 0 0 4px #14171c, 0 0 0 5px #3b4048, 0 0 40px 6px rgba(0,0,0,0.7)', background: '#000' }}
        >
          {/* imagen óptica: fondo iluminado × capas, con brillo y contraste del dominio */}
          <div className="absolute inset-0" style={{ filter: `contrast(${p.contraste.toFixed(3)}) brightness(${brilloCss.toFixed(3)})`, isolation: 'isolate' }}>
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${prep.fondo} 0%, ${prep.fondo} 55%, color-mix(in srgb, ${prep.fondo} 88%, #6b5a3c) 100%)` }} />
            {prep.capas.map((c, k) => (
              <canvas
                key={`${p.caso}-${c.id}`} ref={(el) => { fijas.current[k] = el; }}
                className="pointer-events-none absolute" data-capa={c.id}
                style={{ left: -PAD, top: -PAD, width: lado, height: lado, mixBlendMode: 'multiply', filter: filtroCapa(c.z) }}
              />
            ))}
            {prep.viva && (
              <canvas ref={viva} className="pointer-events-none absolute" data-capa="viva"
                style={{ left: -PAD, top: -PAD, width: lado, height: lado, mixBlendMode: 'multiply', filter: filtroCapa(prep.viva.z) }} />
            )}
            <div className="pointer-events-none absolute inset-0" style={{ background: luz, mixBlendMode: 'multiply' }} />
          </div>
          {p.lechoso && <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3), rgba(255,255,255,0.16))' }} />}
          {/* grano del sensor, motas en la óptica (no se mueven con la platina) y viñeteado */}
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: granoCss, opacity: 0.07, mixBlendMode: 'overlay' }} />
          {[[23, 31, 5], [68, 22, 3.4], [74, 71, 6.2], [36, 77, 2.6]].map(([x, y, r], i) => (
            <div key={i} className="pointer-events-none absolute rounded-full" style={{
              left: `${x}%`, top: `${y}%`, width: `${r}%`, height: `${r}%`,
              background: 'radial-gradient(circle, rgba(0,0,0,0) 34%, rgba(20,16,10,0.085) 52%, rgba(0,0,0,0) 72%)',
            }} />
          ))}
          <div className="pointer-events-none absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(0,0,0,0) 58%, rgba(0,0,0,0.16) 82%, rgba(0,0,0,0.62) 100%)',
            boxShadow: 'inset 0 0 0 2px rgba(70,110,255,0.22), inset 0 0 0 4px rgba(255,170,60,0.12)',
          }} />
          {cambio.current > 0 && <div key={cambio.current} className="bio01-giro pointer-events-none absolute inset-0 bg-black" />}

          {/* herramientas de medida: nítidas, por encima de la imagen */}
          <svg className="pointer-events-none absolute inset-0" width={D} height={D} viewBox={`0 0 ${D} ${D}`} aria-hidden>
            {p.marco && (
              <g>
                <rect x={D / 2 - marcoPx / 2} y={D / 2 - marcoPx / 2} width={marcoPx} height={marcoPx} fill="none" stroke="#0b0f14" strokeOpacity={0.55} strokeWidth={4} />
                <rect x={D / 2 - marcoPx / 2} y={D / 2 - marcoPx / 2} width={marcoPx} height={marcoPx} fill="none" stroke="#facc15" strokeWidth={2} data-marco-conteo="" />
              </g>
            )}
            {p.marcas.map((m, i) => {
              const [x, y] = aPx(m.x, m.y);
              return <g key={i}><circle cx={x} cy={y} r={6.5} fill="none" stroke="#0b0f14" strokeWidth={4} strokeOpacity={0.6} /><circle cx={x} cy={y} r={6.5} fill="none" stroke={COLORES_MARCA[m.cat % 3]} strokeWidth={2.2} /></g>;
            })}
            {med && (() => {
              const [x1, y1] = aPx(med.ax, med.ay), [x2, y2] = aPx(med.bx, med.by);
              const nx = y1 - y2, ny = x2 - x1, n = Math.hypot(nx, ny) || 1, tx = (nx / n) * 7, ty = (ny / n) * 7;
              const linea = `M${x1} ${y1}L${x2} ${y2}M${x1 - tx} ${y1 - ty}L${x1 + tx} ${y1 + ty}M${x2 - tx} ${y2 - ty}L${x2 + tx} ${y2 + ty}`;
              return <g><path d={linea} stroke="#0b0f14" strokeOpacity={0.65} strokeWidth={5} strokeLinecap="round" /><path d={linea} stroke="#22d3ee" strokeWidth={2} strokeLinecap="round" /></g>;
            })()}
          </svg>
          {med && (() => {
            const [x1, y1] = aPx(med.ax, med.ay), [x2, y2] = aPx(med.bx, med.by);
            const largo = Math.hypot(med.bx - med.ax, med.by - med.ay);
            return (
              <div className="pointer-events-none absolute -translate-x-1/2 rounded-md bg-[#0b0f14]/85 px-2 py-0.5 font-mono text-[14px] font-semibold text-cyan-200" data-lectura-regla=""
                style={{ left: Math.min(D - 60, Math.max(60, (x1 + x2) / 2)), top: Math.min(D - 30, Math.max(6, (y1 + y2) / 2 + 10)) }}>
                {fmtUm(largo)}
              </div>
            );
          })()}
          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center rounded-md bg-[#0b0f14]/75 px-2.5 pb-1.5 pt-0.5" style={{ top: '84%' }} data-barra-escala="">
            <span className="font-mono text-[13px] font-semibold leading-tight text-white">{fmtUm(barra)}</span>
            <span className="mt-0.5 block h-[3px] rounded-sm bg-white" style={{ width: barra * sCss }} />
          </div>
        </div>
      )}
    </div>
  );
});

export default CampoOcular;
