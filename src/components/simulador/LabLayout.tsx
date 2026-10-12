'use client';
/**
 * LabLayout — plantilla de pantalla de los labs base.
 *
 * Problema que resuelve: los Piloto ponían paneles `absolute` ENCIMA del lienzo y
 * tapaban la escena (péndulo, Hooke, prensa, titulación). Aquí la escena tiene un
 * área GARANTIZADA y los HUD van en franjas compactas:
 *
 *   ┌──────────────── barraSuperior (lecturas, 40 px) ────────────────┐
 *   │                                               │ panelLateral     │
 *   │                 escena (flex-1)               │ (plegable;       │
 *   │                                               │  en estrecho se  │
 *   │                                               │  superpone)      │
 *   ├──────────────── controles (≤ 38 % del alto) ─────────────────────┤
 *
 * El contenedor real es la columna central de SimuladorClient: ~556×688 a
 * 1366×768, ~720×820 a 1600×900 y ~944×1000 a 1920×1080. Por debajo de 640 px de
 * ancho el panel lateral arranca plegado y, al abrirse, se superpone por la derecha
 * (lo pide el alumno: no tapa nada que no haya pedido).
 */
import React, { useEffect, useRef, useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

export interface LabLayoutProps {
  escena: React.ReactNode;
  barraSuperior?: React.ReactNode;
  controles?: React.ReactNode;
  panelLateral?: React.ReactNode;
  tituloPanel?: string;
  /** por defecto: abierto si cabe (ancho ≥ 760 px) */
  panelAbiertoInicial?: boolean;
  /** indicador pequeño en la esquina superior izquierda de la escena (no usar para paneles) */
  esquina?: React.ReactNode;
  className?: string;
}

const ANCHO_ESTRECHO = 640;
const ANCHO_PANEL_ABIERTO = 760;

export default function LabLayout({ escena, barraSuperior, controles, panelLateral, tituloPanel = 'Datos', panelAbiertoInicial, esquina, className = '' }: LabLayoutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState<number | null>(null);
  const [abierto, setAbierto] = useState<boolean | null>(panelAbiertoInicial ?? null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (abierto === null && ancho !== null) setAbierto(ancho >= ANCHO_PANEL_ABIERTO);
  }, [ancho, abierto]);
  const estrecho = ancho !== null && ancho < ANCHO_ESTRECHO;
  const panelVisible = !!panelLateral && !!abierto;

  return (
    <div ref={ref} className={`flex h-full w-full min-h-0 flex-col overflow-hidden bg-[#0b1220] font-['Outfit'] text-slate-100 ${className}`} data-lab-layout="">
      {barraSuperior && (
        <div className="flex min-h-[40px] shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0f1a2b] px-2.5 py-1.5 [scrollbar-width:thin]" data-franja="superior">
          {barraSuperior}
        </div>
      )}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1" data-franja="escena">
          {escena}
          {esquina && <div className="pointer-events-none absolute left-2 top-2 max-w-[45%]">{esquina}</div>}
          {panelLateral && !panelVisible && (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="absolute right-2 top-2 flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-[#0f1a2b]/85 px-2.5 text-[11px] font-semibold text-slate-200 backdrop-blur hover:border-[#219EBC] hover:text-white"
              aria-label={`Abrir panel ${tituloPanel}`}
            >
              <PanelRightOpen size={14} /> {tituloPanel}
            </button>
          )}
        </div>
        {panelVisible && (
          <aside
            className={`flex min-h-0 flex-col border-l border-white/10 bg-[#0f1a2b] ${estrecho ? 'absolute inset-y-0 right-0 z-10 w-[min(82%,300px)] shadow-2xl shadow-black/50' : 'w-[clamp(220px,30%,300px)] shrink-0'}`}
            data-franja="lateral"
          >
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 px-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">{tituloPanel}</span>
              <button type="button" onClick={() => setAbierto(false)} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Plegar panel">
                <PanelRightClose size={15} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 text-[13px] leading-snug">{panelLateral}</div>
          </aside>
        )}
      </div>
      {controles && (
        <div className="max-h-[38%] shrink-0 overflow-y-auto border-t border-white/10 bg-[#0f1a2b] px-3 py-2" data-franja="controles">
          {controles}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── piezas de HUD ─────────────────────────────

/** Lectura compacta: etiqueta pequeña + valor tabular + unidad. */
export function Lectura({ etiqueta, valor, unidad, acento = false, title }: { etiqueta: string; valor: React.ReactNode; unidad?: string; acento?: boolean; title?: string }) {
  return (
    <div title={title} className={`flex shrink-0 items-baseline gap-1.5 rounded-lg border px-2 py-1 ${acento ? 'border-[#FB8500]/40 bg-[#FB8500]/10' : 'border-white/10 bg-white/[0.04]'}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{etiqueta}</span>
      <span className={`font-mono text-[13px] font-semibold tabular-nums ${acento ? 'text-[#FFB703]' : 'text-white'}`}>{valor}</span>
      {unidad && <span className="text-[11px] text-slate-400">{unidad}</span>}
    </div>
  );
}

/** Fila de controles que se reparte y salta de línea en pantallas estrechas. */
export function GrupoControles({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-end gap-x-4 gap-y-2 ${className}`}>{children}</div>;
}

/** Deslizador con etiqueta y valor. */
export function Deslizador({
  etiqueta, valor, min, max, paso = 1, unidad, onChange, decimales, ancho = 'w-40', deshabilitado = false,
}: {
  etiqueta: string; valor: number; min: number; max: number; paso?: number; unidad?: string;
  onChange: (v: number) => void; decimales?: number; ancho?: string; deshabilitado?: boolean;
}) {
  const dec = decimales ?? (paso < 1 ? Math.min(3, String(paso).split('.')[1]?.length ?? 1) : 0);
  return (
    <label className={`flex flex-col gap-1 ${ancho} min-w-[120px] ${deshabilitado ? 'opacity-50' : ''}`}>
      <span className="flex justify-between text-[11px] font-semibold text-slate-300">
        <span>{etiqueta}</span>
        <span className="font-mono tabular-nums text-white">{valor.toFixed(dec)}{unidad ? ` ${unidad}` : ''}</span>
      </span>
      <input
        type="range" min={min} max={max} step={paso} value={valor} disabled={deshabilitado}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]"
      />
    </label>
  );
}

/** Botón del HUD. */
export function BotonLab({ children, onClick, variante = 'primario', deshabilitado = false, title }: {
  children: React.ReactNode; onClick?: () => void; variante?: 'primario' | 'secundario' | 'acento'; deshabilitado?: boolean; title?: string;
}) {
  const estilos = {
    primario: 'bg-[#219EBC] text-white hover:bg-[#1b87a1]',
    secundario: 'border border-white/15 bg-white/[0.04] text-slate-200 hover:border-[#219EBC] hover:text-white',
    acento: 'bg-[#FB8500] text-white hover:bg-[#e07700]',
  }[variante];
  return (
    <button type="button" title={title} onClick={onClick} disabled={deshabilitado}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${estilos}`}>
      {children}
    </button>
  );
}

/** Selector segmentado (p. ej. calidad, modo, planeta). */
export function Segmentado<T extends string>({ opciones, valor, onChange, etiqueta }: { opciones: { valor: T; texto: string }[]; valor: T; onChange: (v: T) => void; etiqueta?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {etiqueta && <span className="text-[11px] font-semibold text-slate-300">{etiqueta}</span>}
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
        {opciones.map((o) => (
          <button key={o.valor} type="button" onClick={() => onChange(o.valor)}
            className={`h-7 rounded-md px-2.5 text-[11px] font-semibold ${valor === o.valor ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
