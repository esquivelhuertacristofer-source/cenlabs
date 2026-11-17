"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { RefreshCcw, ShieldCheck, CheckCircle2, Play, Pause, Droplet, Grid3x3, Layers, Maximize2, Turtle, Rabbit } from 'lucide-react';
import LabLayout, { GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Galton3DScene, { useMovimientoReducido } from './simuladores/mat10/Galton3DScene';
import { DockGalton, Xbarra } from './simuladores/mat10/Dock';
import { useBancoGalton, type Vista } from './simuladores/mat10/banco';
import { alfaDeP } from './simuladores/mat10/galton';
import { estadisticaMuestraM10, chiCuadradaM10, evaluarM10, MUESTRA_MIN_M10 } from '@/domain/matematicas';

const VISTAS: { v: Vista; t: string; icono: React.ReactNode; d: string }[] = [
  { v: 'tablero', t: 'Tablero', icono: <Maximize2 size={14} />, d: 'La máquina entera' },
  { v: 'clavos', t: 'Clavos', icono: <Grid3x3 size={14} />, d: 'La tolva y las diez filas de clavos, de cerca' },
  { v: 'pilas', t: 'Pilas', icono: <Layers size={14} />, d: 'Los once canales y sus pilas' },
];

/** Ancho de la columna del laboratorio desde el que el panel «Muestra» cabe AL LADO de la máquina sin taparla. */
const ANCHO_CON_DOCK = 760;

/**
 * Letra ≥ 13 px en los mandos del kit (botones, deslizador, cabecera del panel), sólo
 * dentro de esta práctica: el kit común no se toca.
 */
const LETRA_13 = '[&_[data-franja]_button]:text-[13px] [&_[data-franja=controles]_label_span]:text-[13px] [&_[data-franja=lateral]>div:first-child_span]:text-[13px] [&_[data-franja=lateral]>div:first-child_span]:tracking-[0.08em]';

/** Lectura de la barra superior, con rótulo ≥ 13 px (la del kit lo pone a 10 px y en mayúsculas: «x̄» salía descompuesta). */
function LecturaG({ etiqueta, valor, acento = false, title }: { etiqueta: React.ReactNode; valor: React.ReactNode; acento?: boolean; title?: string }) {
  return (
    <div title={title} className={`flex shrink-0 items-baseline gap-1.5 rounded-lg border px-2 py-1 ${acento ? 'border-[#FB8500]/40 bg-[#FB8500]/10' : 'border-white/10 bg-white/[0.04]'}`}>
      <span className="text-[13px] font-semibold text-slate-400">{etiqueta}</span>
      <span className={`font-mono text-[14px] font-semibold tabular-nums ${acento ? 'text-[#FFB703]' : 'text-white'}`}>{valor}</span>
    </div>
  );
}

/**
 * MAT-10 · Máquina de Galton. Cada bolita choca con FILAS_M10 = 10 clavos y en cada
 * uno sigue a la derecha con probabilidad p, que fija la inclinación α del tablero:
 * el canal final sigue una Binomial(10, p). El alumno PREDICE μ y σ, recolecta
 * ≥ 200 bolitas y el validador comprueba la predicción y el ajuste χ².
 *
 * NO REGALAR: ni la escena, ni el dock, ni la barra muestran μ, σ, la binomial del
 * modelo ni su normal hasta que la validación da por buena la predicción. Antes sólo
 * se dibuja la curva con los números que el alumno escribe.
 */
export default function PilotoGalton({ onValidate }: { onValidate?: () => void }) {
  const {
    galton10, lanzarBolitasM10, vaciarGaltonM10, setProbabilidadM10, setPrediccionM10, audio, setAsistente,
  } = useSimuladorStore(useShallow((s) => ({
    galton10: s.galton10, lanzarBolitasM10: s.lanzarBolitasM10, vaciarGaltonM10: s.vaciarGaltonM10,
    setProbabilidadM10: s.setProbabilidadM10, setPrediccionM10: s.setPrediccionM10,
    audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { probabilidad, contenedores, status, prediccionMedia, prediccionSigma } = galton10;
  const { vista, lenta, goteo, alfaVis, setVista, setLenta, setGoteo, reiniciarBanco, setDockVisible } = useBancoGalton(useShallow((s) => ({
    vista: s.vista, lenta: s.lenta, goteo: s.goteo, alfaVis: s.alfaVis,
    setVista: s.setVista, setLenta: s.setLenta, setGoteo: s.setGoteo, reiniciarBanco: s.reiniciar, setDockVisible: s.setDockVisible,
  })));
  const reducido = useMovimientoReducido();

  const muestra = useMemo(() => estadisticaMuestraM10(contenedores), [contenedores]);
  const validado = status === 'success';
  const chi = useMemo(() => (validado ? chiCuadradaM10(contenedores, probabilidad) : null), [validado, contenedores, probabilidad]);
  const N = muestra.N;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Cada bolita choca con 10 clavos y en cada uno va a la derecha con probabilidad p. Predice la media μ y la desviación σ del contenedor final y compruébalas con al menos 200 bolitas.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // banco nuevo en cada entrada; con «reducir movimiento» la tolva arranca cerrada
  useEffect(() => { reiniciarBanco(!reducido); }, [reiniciarBanco, reducido]);

  // El panel «Muestra» sólo existe si cabe al lado de la máquina (no encima). En columnas
  // estrechas (1366 px, móvil) el histograma lo lleva la bitácora; nunca los dos a la vez.
  const raiz = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState<number | null>(null);
  useEffect(() => {
    const el = raiz.current; if (!el) return;
    const publicar = () => setDockVisible(!!el.querySelector('[data-dock="galton"]'));
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    const mo = new MutationObserver(publicar);
    mo.observe(el, { childList: true, subtree: true });
    publicar();
    return () => { ro.disconnect(); mo.disconnect(); setDockVisible(false); };
  }, [setDockVisible]);
  const conDock = ancho !== null && ancho >= ANCHO_CON_DOCK;


  const fmt = (v: number, d: number) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  // inclinación: la que muestra la escena en este cuadro (o la que pide p, sin escena)
  const alfaGrados = ((alfaVis ?? alfaDeP(probabilidad)) * 180) / Math.PI;
  const campo = 'h-9 w-24 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 font-mono text-[14px] font-semibold text-white outline-none focus:border-[#FB8500]';
  // el aviso orienta (qué falta: bolitas, escribir, cuál número no cuadra) sin dar μ ni σ
  const aviso = status === 'error' ? (evaluarM10(galton10).mensaje ?? 'Ya está todo: vuelve a validar.') : null;
  return (
    <div ref={raiz} className="h-full w-full min-h-0 min-w-0 overflow-hidden [contain:inline-size]" data-lab="matematicas-10">
    {mounted && ancho !== null && <LabLayout
      key={conDock ? 'con-dock' : 'sin-dock'}
      className={LETRA_13}
      tituloPanel="Muestra"
      panelAbiertoInicial={conDock}
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <LecturaG etiqueta="p" valor={probabilidad.toFixed(2)} acento title="Probabilidad de ir a la derecha en cada clavo" />
          <LecturaG etiqueta="∠" valor={`${alfaGrados >= 0 ? '' : '−'}${Math.abs(alfaGrados).toFixed(2)}°`} title="Inclinación del tablero (baja el lado derecho si α > 0)" />
          <LecturaG etiqueta="N" valor={`${N} / ${MUESTRA_MIN_M10}`} title="Bolitas en los contenedores" />
          <LecturaG etiqueta={<Xbarra />} valor={fmt(muestra.media, 2)} title="Media de la muestra" />
          <LecturaG etiqueta="s" valor={fmt(muestra.sigma, 2)} title="Desviación de la muestra" />
          {chi && (
            <LecturaG etiqueta="χ² / crítico" valor={`${chi.chi2.toFixed(1)} / ${chi.critico.toFixed(1)}`} title="Estadístico χ² contra su valor crítico (α = 0.001)" />
          )}
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#07090d]">
          <Galton3DScene />
          <div className="absolute bottom-2 left-2 flex rounded-lg border border-white/10 bg-[#0b1220]/80 p-0.5 backdrop-blur" role="group" aria-label="Vista de cámara">
            {VISTAS.map((o) => (
              <button key={o.v} type="button" title={o.d} onClick={() => { setVista(o.v); audio?.playPop(); }}
                className={`flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-semibold ${vista === o.v ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
                {o.icono}{o.t}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setLenta(!lenta)} title={lenta ? 'Pasar a tiempo real' : 'Pasar a cámara lenta'}
            aria-pressed={lenta}
            className={`absolute bottom-2 right-2 flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-semibold backdrop-blur hover:text-white ${lenta ? 'border-[#FB8500]/60 bg-[#FB8500]/20 text-[#FFD08A]' : 'border-white/10 bg-[#0b1220]/80 text-cyan-100/90'}`}>
            {lenta ? <Turtle size={15} /> : <Rabbit size={15} />}
            <span className="font-mono">{lenta ? '×¼' : '×1'}</span>
            <span className="hidden sm:inline">{lenta ? 'cámara lenta' : 'tiempo real'}</span>
          </button>
        </div>
      }
      panelLateral={conDock ? <DockGalton /> : undefined}
      controles={
        <div className="space-y-2">
          <GrupoControles className="items-end">
            <div title="Inclina el tablero. Cambiar p vacía la máquina: cada muestra corresponde a una sola p.">
              <Deslizador etiqueta="Probabilidad a la derecha (p)" valor={probabilidad} min={0.1} max={0.9} paso={0.05} decimales={2} ancho="w-[13.5rem]"
                onChange={(v) => { setProbabilidadM10(v); audio?.playPop(); }} />
            </div>
            <BotonLab variante="acento" title="Soltar 100 bolitas" onClick={() => { lanzarBolitasM10(); audio?.playPop(); }}>
              <Play size={14} fill="currentColor" /> Soltar 100
            </BotonLab>
            <BotonLab variante={goteo ? 'primario' : 'secundario'} title={goteo ? 'Cerrar el goteo de la tolva' : 'Abrir el goteo: una bolita cada vez'} onClick={() => { setGoteo(!goteo); audio?.playPop(); }}>
              {goteo ? <Pause size={14} /> : <Droplet size={14} />} Goteo
            </BotonLab>
            <BotonLab variante="secundario" title="Vaciar la máquina" onClick={() => { vaciarGaltonM10(); audio?.playPop(); }}>
              <RefreshCcw size={14} /> Vaciar
            </BotonLab>
          </GrupoControles>
          <GrupoControles className="items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-slate-300">Tu μ teórica</span>
              <input type="text" inputMode="decimal" value={prediccionMedia} placeholder="μ" onChange={(e) => setPrediccionM10(e.target.value, prediccionSigma)} className={campo} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-slate-300">Tu σ teórica</span>
              <input type="text" inputMode="decimal" value={prediccionSigma} placeholder="σ" onChange={(e) => setPrediccionM10(prediccionMedia, e.target.value)} className={campo} />
            </label>
            <BotonLab variante={validado ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              {validado ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {validado ? 'Distribución correcta' : 'Validar distribución'}
            </BotonLab>
            {aviso && <span role="status" className="min-w-[200px] flex-1 basis-full text-[13px] font-semibold leading-snug text-rose-300" data-aviso="validacion">{aviso}</span>}
          </GrupoControles>
        </div>
      }
    />}
    </div>
  );
}
