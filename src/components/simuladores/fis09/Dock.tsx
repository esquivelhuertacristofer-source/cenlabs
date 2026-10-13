'use client';
/**
 * fis09/Dock.tsx — el dock de instrumentos del banco de Coulomb, en DOM nítido (lienzo a
 * devicePixelRatio, tipografía del lab). La gráfica F–r se redibuja desde la suscripción al
 * MISMO reloj que mueve la escena: su marcador está siempre en la r que se ve en 3D.
 *
 * Antes de validar no hay ni una cifra de fuerza (el reto pide calcularla): la gráfica va en
 * escala relativa, el cambio entre ajustes se da como razón (×4, ÷9…) y el recuento de
 * líneas de Gauss no depende de k. Tras validar aparecen F del banco y el punto del reto.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { dibujarGraficaFr, fuerza, colorProducto, type PuntoMedido } from './grafica';
import { resumenGauss, fmtFuerza, fmtNum, LINEAS_POR_MICROC, cargaMaximaEnAire, R_ESFERA_CM } from './campo';
import type { RelojCampo } from './reloj';

const fmtQ = (q: number) => `${q > 0 ? '+' : '−'}${Math.abs(q)} μC`;

function familia() {
  return typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui';
}

/** Gráfica F–r: se ajusta al ancho del contenedor y dibuja a devicePixelRatio. */
function GraficaFr({ reloj, q1, q2, puntos, validado, reto, alto }: {
  reloj: RelojCampo; q1: number; q2: number; puntos: PuntoMedido[]; validado: boolean;
  reto: { q1: number; q2: number; r: number }; alto: number;
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
  // los datos que no vienen del reloj se leen desde una ref (el dibujo es imperativo)
  const datos = useRef({ q1, q2, puntos, validado, reto });
  datos.current = { q1, q2, puntos, validado, reto };
  const ultimo = useRef('');
  useEffect(() => {
    const c = lienzo.current; if (!c || ancho < 40) return;
    const fam = familia();
    const dibujar = (forzar: boolean) => {
      const d = datos.current;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const clave = [reloj.vis.r.toFixed(3), d.q1, d.q2, d.puntos.length, d.validado, ancho, alto, dpr].join('|');
      if (!forzar && clave === ultimo.current) return;
      ultimo.current = clave;
      const W = Math.round(ancho * dpr), H = Math.round(alto * dpr);
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      const ctx = c.getContext('2d'); if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dibujarGraficaFr(ctx, ancho, alto, { r: reloj.vis.r, q1: d.q1, q2: d.q2, puntos: d.puntos, validado: d.validado, reto: d.reto, fuente: fam });
    };
    dibujar(true);
    return reloj.suscribir(() => dibujar(false));
  }, [reloj, ancho, alto]);
  // cambios de datos sin paso de reloj (p. ej. anotar con la escena en pausa)
  useEffect(() => { ultimo.current = ''; }, [q1, q2, puntos, validado]);
  useEffect(() => {
    const c = lienzo.current; if (!c || ancho < 40) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dibujarGraficaFr(ctx, ancho, alto, { r: reloj.vis.r, q1, q2, puntos, validado, reto, fuente: familia() });
  }, [q1, q2, puntos, validado, reto, ancho, alto, reloj]);
  return (
    <div ref={caja} className="w-full">
      <canvas ref={lienzo} style={{ width: '100%', height: alto }} className="block rounded-lg"
        role="img" aria-label="Gráfica logarítmica de la fuerza frente a la separación: una recta de pendiente −2" />
    </div>
  );
}

function Desplegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-[11.5px] font-semibold text-slate-200 hover:text-white">
        <ChevronRight size={13} className={`shrink-0 transition-transform ${abierto ? 'rotate-90' : ''}`} /> {titulo}
      </button>
      {abierto && <div className="space-y-1.5 px-3 pb-2.5 text-[11px] leading-snug text-slate-300">{children}</div>}
    </div>
  );
}

export interface DockProps {
  reloj: RelojCampo;
  q1: number;
  q2: number;
  r: number;
  reto: { q1: number; q2: number; r: number };
  puntos: PuntoMedido[];
  onAnotar: () => void;
  onBorrar: () => void;
  validado: boolean;
  /** razón F(ahora)/F(ajuste anterior), o null si aún no hubo cambio */
  razon: { factor: number; que: string } | null;
}

export function DockCampo({ reloj, q1, q2, r, reto, puntos, onAnotar, onBorrar, validado, razon }: DockProps) {
  const g = resumenGauss(q1, q2);
  const atrae = q1 * q2 < 0;
  const qMaxNc = cargaMaximaEnAire(R_ESFERA_CM / 100) * 1e9;
  return (
    <div className="flex flex-col gap-2.5 text-[12px] text-slate-200" data-dock-fis09="">
      <p className="text-[11.5px] leading-snug text-slate-300">
        Las líneas salen de las cargas <b className="text-[#ff7a5c]">+</b> y entran en las <b className="text-[#6aa6ff]">−</b>; las pompas unen puntos de igual potencial.
      </p>

      <section className="rounded-xl border border-white/10 bg-[#0b1422] p-2" aria-label="Fuerza frente a separación">
        <div className="mb-1 flex items-center justify-between gap-2 px-0.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#8ECAE6]">Fuerza y separación</span>
          <span className="text-[10.5px] font-semibold text-[#ffcf8a]">{atrae ? 'atracción' : 'repulsión'}</span>
        </div>
        <GraficaFr reloj={reloj} q1={q1} q2={q2} puntos={puntos} validado={validado} reto={reto} alto={178} />
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={onAnotar} data-accion="anotar"
            className="flex h-7 items-center gap-1 rounded-md border border-[#ffb547]/40 bg-[#ffb547]/10 px-2 text-[11px] font-semibold text-[#ffd9a0] hover:bg-[#ffb547]/20">
            <Plus size={12} /> Anotar punto
          </button>
          {puntos.length > 0 && (
            <button type="button" onClick={onBorrar} aria-label="Borrar mis puntos"
              className="flex h-7 items-center gap-1 rounded-md border border-white/10 px-2 text-[11px] text-slate-300 hover:text-white">
              <Trash2 size={12} /> {puntos.length}
            </button>
          )}
          {razon && (
            <span className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[11.5px] tabular-nums text-white" data-razon="" title={`respecto al ajuste anterior (${razon.que})`}>
              F {razon.factor >= 1 ? '×' : '÷'} {fmtNum(razon.factor >= 1 ? razon.factor : 1 / razon.factor, razon.factor >= 10 || razon.factor <= 0.1 ? 1 : 2)}
            </span>
          )}
        </div>
        {puntos.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {[...new Map(puntos.map((p) => [Math.abs(p.q1 * p.q2), p])).values()].map((p) => (
              <span key={Math.abs(p.q1 * p.q2)} className="flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-300">
                <i className="inline-block h-2 w-2 rounded-full" style={{ background: colorProducto(p.q1 * p.q2) }} />{fmtQ(p.q1)} · {fmtQ(p.q2)}
              </span>
            ))}
          </div>
        )}
      </section>

      {validado && (
        <section className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-2.5" data-fuerza-validada="">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold text-emerald-200">Reto: |F|</span>
            <span className="font-mono text-[15px] font-bold tabular-nums text-white">{fmtFuerza(fuerza(reto.q1, reto.q2, reto.r))} N</span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="text-[11px] text-emerald-200/80">Banco ahora ({r} cm)</span>
            <span className="font-mono text-[13px] tabular-nums text-emerald-50">{fmtFuerza(fuerza(q1, q2, r))} N</span>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5" aria-label="Recuento de líneas de campo">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#8ECAE6]">Líneas de campo</span>
          <span className="text-[10.5px] text-slate-400">{LINEAS_POR_MICROC} por μC</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[q1, q2].map((q, i) => (
            <div key={i} className="rounded-lg bg-white/[0.04] px-2 py-1.5">
              <div className="text-[10px] text-slate-400">q{i === 0 ? '₁' : '₂'} {fmtQ(q)}</div>
              <div className="font-mono text-[15px] font-bold tabular-nums" style={{ color: q > 0 ? '#ff8a6e' : '#7fb0ff' }}>
                {g.porCarga[i]} <span className="text-[10.5px] font-semibold text-slate-400">{q > 0 ? 'salen' : 'entran'}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 text-[10.5px] text-slate-400">
          unen las cargas <b className="font-mono text-slate-200">{g.unen}</b> · van al infinito <b className="font-mono text-slate-200">{g.infinito}</b>
        </div>
      </section>

      <Desplegable titulo="Ecuaciones del modelo">
        <p className="font-mono text-[11px] text-slate-100">|F| = k·|q₁q₂| / r²</p>
        <p className="font-mono text-[11px] text-slate-100">E⃗(P) = Σ k·qᵢ·r̂ᵢ / rᵢ²   ·   V(P) = Σ k·qᵢ / rᵢ</p>
        <p className="font-mono text-[11px] text-slate-100">∮ E⃗·dA⃗ = q_enc / ε₀</p>
        <p>Cada línea se integra con Runge–Kutta 4 siguiendo E⃗/|E⃗|. De cada carga salen {LINEAS_POR_MICROC}·|q| líneas repartidas por igual en ángulo sólido: su número es proporcional a la carga (Gauss) y su densidad, a |E|. Las superficies se dibujan a ΔV constante: se apiñan donde el campo es intenso.</p>
      </Desplegable>
      <Desplegable titulo="Qué simplifica el modelo">
        <p>Las esferas se tratan como cargas puntuales en el vacío. Unas esferas conductoras reales se polarizan cuando están cerca (r ≲ 5 diámetros) y la fuerza se aparta de k·q₁q₂/r².</p>
        <p>Las cargas en μC son las de los problemas de libro: una esfera de Ø 1,8 cm en aire sólo retiene unos {fmtNum(qMaxNc, 0)} nC antes del efecto corona (ruptura del aire, 3 MV/m).</p>
        <p>El banco, la mesa y las columnas no deforman el campo. Los trazos que recorren las líneas indican el sentido de E⃗: no es materia que fluya.</p>
      </Desplegable>
    </div>
  );
}
