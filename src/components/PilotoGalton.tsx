"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { RefreshCcw, ShieldCheck, CheckCircle2, Play, Pause, Droplet, Grid3x3, Layers, Maximize2, Turtle, Rabbit } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Galton3DScene, { useMovimientoReducido } from './simuladores/mat10/Galton3DScene';
import { DockGalton } from './simuladores/mat10/Dock';
import { useBancoGalton, type Vista } from './simuladores/mat10/banco';
import { alfaDeP } from './simuladores/mat10/galton';
import { estadisticaMuestraM10, chiCuadradaM10, MUESTRA_MIN_M10 } from '@/domain/matematicas';

const VISTAS: { v: Vista; t: string; icono: React.ReactNode; d: string }[] = [
  { v: 'tablero', t: 'Tablero', icono: <Maximize2 size={13} />, d: 'La máquina entera' },
  { v: 'clavos', t: 'Clavos', icono: <Grid3x3 size={13} />, d: 'La tolva y las diez filas de clavos, de cerca' },
  { v: 'pilas', t: 'Pilas', icono: <Layers size={13} />, d: 'Los once canales y sus pilas' },
];

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
  const { vista, lenta, goteo, alfaVis, setVista, setLenta, setGoteo, reiniciarBanco } = useBancoGalton(useShallow((s) => ({
    vista: s.vista, lenta: s.lenta, goteo: s.goteo, alfaVis: s.alfaVis,
    setVista: s.setVista, setLenta: s.setLenta, setGoteo: s.setGoteo, reiniciarBanco: s.reiniciar,
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

  if (!mounted) return null;

  const fmt = (v: number, d: number) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  // inclinación: la que muestra la escena en este cuadro (o la que pide p, sin escena)
  const alfaGrados = ((alfaVis ?? alfaDeP(probabilidad)) * 180) / Math.PI;
  const campo = 'h-8 w-24 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 font-mono text-[13px] font-semibold text-white outline-none focus:border-[#FB8500]';
  return (
    <LabLayout
      tituloPanel="Muestra"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="p" valor={probabilidad.toFixed(2)} acento title="Probabilidad de ir a la derecha en cada clavo" />
          <Lectura etiqueta="∠" valor={`${alfaGrados >= 0 ? '' : '−'}${Math.abs(alfaGrados).toFixed(2)}°`} title="Inclinación del tablero (baja el lado derecho si α > 0)" />
          <Lectura etiqueta="N" valor={`${N} / ${MUESTRA_MIN_M10}`} title="Bolitas en los contenedores" />
          <Lectura etiqueta="x̄" valor={fmt(muestra.media, 2)} title="Media de la muestra" />
          <Lectura etiqueta="s" valor={fmt(muestra.sigma, 2)} title="Desviación de la muestra" />
          {chi && (
            <Lectura etiqueta="χ² / crítico" valor={`${chi.chi2.toFixed(1)} / ${chi.critico.toFixed(1)}`} title="Estadístico χ² contra su valor crítico (α = 0.001)" />
          )}
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#07090d]">
          <Galton3DScene />
          <div className="absolute bottom-2 left-2 flex rounded-lg border border-white/10 bg-[#0b1220]/80 p-0.5 backdrop-blur" role="group" aria-label="Vista de cámara">
            {VISTAS.map((o) => (
              <button key={o.v} type="button" title={o.d} onClick={() => { setVista(o.v); audio?.playPop(); }}
                className={`flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold ${vista === o.v ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
                {o.icono}{o.t}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setLenta(!lenta)} title={lenta ? 'Pasar a tiempo real' : 'Pasar a cámara lenta'}
            className="absolute bottom-2 right-2 flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#0b1220]/80 px-2 font-mono text-[11px] font-semibold text-cyan-100/90 backdrop-blur hover:text-white">
            {lenta ? <Turtle size={13} /> : <Rabbit size={13} />}{lenta ? '×1/4 · cámara lenta' : '×1 · tiempo real'}
          </button>
        </div>
      }
      panelLateral={<DockGalton />}
      controles={
        <div className="space-y-2">
          <GrupoControles className="items-end">
            <div title="Inclina el tablero. Cambiar p vacía la máquina: cada muestra corresponde a una sola p.">
              <Deslizador etiqueta="Probabilidad de ir a la derecha (p)" valor={probabilidad} min={0.1} max={0.9} paso={0.05} decimales={2} ancho="w-52 2xl:w-60"
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
              <span className="text-[11px] font-semibold text-slate-300">Tu μ teórica</span>
              <input type="text" inputMode="decimal" value={prediccionMedia} placeholder="μ" onChange={(e) => setPrediccionM10(e.target.value, prediccionSigma)} className={campo} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Tu σ teórica</span>
              <input type="text" inputMode="decimal" value={prediccionSigma} placeholder="σ" onChange={(e) => setPrediccionM10(prediccionMedia, e.target.value)} className={campo} />
            </label>
            <BotonLab variante={validado ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              {validado ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {validado ? 'Distribución correcta' : 'Validar distribución'}
            </BotonLab>
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Revisa tu predicción y la muestra.</span>}
          </GrupoControles>
        </div>
      }
    />
  );
}
